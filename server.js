const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for API logs (in production, use a proper database)
let apiLogs = [];

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(express.static('public'));

// Fonepay Configuration
const FONEPAY_CONFIG = {
  DEV_BASE_URL: 'https://uat-new-merchant-api.fonepay.com/api',
  LIVE_BASE_URL: 'https://merchantapi.fonepay.com/api',
  DEV_WEBSOCKET_URL: 'ws://acquirer-websocket.fonepay.com/merchantEndPoint',
  LIVE_WEBSOCKET_URL: 'wss://ws.fonepay.com/convergent-webSocket-web/merchantEndPoint',
  
  // Test Credentials from document
  TEST_CREDENTIALS: {
    merchantCode: 'fonepay123',
    secretKey: 'fonepay',
    username: 'bijayk',
    password: 'password'
  }
};

// Utility Functions
class FonepayUtils {
  static generateHMACSignature(secretKey, message) {
    try {
      console.log('🔐 Generating HMAC Signature:');
      console.log('   Secret Key:', secretKey);
      console.log('   Message:', message);
      
      const hmac = crypto.createHmac('sha512', secretKey);
      hmac.update(message, 'utf8');
      const signature = hmac.digest('hex').toUpperCase();
      
      console.log('   Generated Signature:', signature);
      return signature;
    } catch (error) {
      console.error('❌ HMAC Generation Error:', error);
      throw error;
    }
  }

  static generateQRRequestSignature(amount, prn, merchantCode, remarks1, remarks2, secretKey) {
    const message = `${amount},${prn},${merchantCode},${remarks1},${remarks2}`;
    return this.generateHMACSignature(secretKey, message);
  }

  static generateCheckStatusSignature(prn, merchantCode, secretKey) {
    const message = `${prn},${merchantCode}`;
    return this.generateHMACSignature(secretKey, message);
  }

  static logApiCall(method, url, headers, body, response) {
    const timestamp = new Date().toISOString();
    const duration = Date.now() - (response?.config?.startTime || Date.now());
    
    const logEntry = {
      id: uuidv4(),
      timestamp,
      type: url.includes('thirdPartyDynamicQrDownload') ? 'QR_GENERATION' : 
            url.includes('thirdPartyDynamicQrGetStatus') ? 'STATUS_CHECK' : 
            'OTHER',
      method,
      url,
      status: response?.status || 0,
      duration,
      request: {
        headers,
        body
      },
      response: {
        headers: response?.headers || {},
        body: response?.data || {},
        status: response?.status || 0
      }
    };

    // Store in memory (keep only last 100 logs)
    apiLogs.unshift(logEntry);
    if (apiLogs.length > 100) {
      apiLogs = apiLogs.slice(0, 100);
    }

    console.log('\n📡 API CALL LOG:');
    console.log('  Method:', method);
    console.log('  URL:', url);
    console.log('  Headers:', JSON.stringify(headers, null, 2));
    console.log('  Request Body:', JSON.stringify(body, null, 2));
    console.log('  Response Status:', response?.status);
    console.log('  Response Data:', JSON.stringify(response?.data, null, 2));
    console.log('  Response Headers:', JSON.stringify(response?.headers, null, 2));
    console.log('─'.repeat(80));
  }
}

// API Routes

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Fonepay QR Tester API is running!',
    timestamp: new Date().toISOString(),
    config: {
      devUrl: FONEPAY_CONFIG.DEV_BASE_URL,
      liveUrl: FONEPAY_CONFIG.LIVE_BASE_URL
    }
  });
});

// API Logs endpoint
app.get('/api/logs', (req, res) => {
  const { type, limit = 50 } = req.query;
  let filteredLogs = apiLogs;
  
  if (type && type !== 'all') {
    filteredLogs = apiLogs.filter(log => log.type === type.toUpperCase());
  }
  
  const limitedLogs = filteredLogs.slice(0, parseInt(limit));
  
  res.json({
    success: true,
    data: {
      logs: limitedLogs,
      total: filteredLogs.length,
      limit: parseInt(limit)
    }
  });
});

// Clear API Logs endpoint
app.delete('/api/logs', (req, res) => {
  apiLogs = [];
  res.json({
    success: true,
    message: 'API logs cleared successfully'
  });
});

// Generate QR Request
app.post('/api/qr/generate', async (req, res) => {
  try {
    const { 
      amount, 
      remarks1 = 'Test Transaction', 
      remarks2 = 'API Test', 
      isLive = false,
      customCredentials 
    } = req.body;

    // Use custom credentials or default test credentials
    const credentials = customCredentials || FONEPAY_CONFIG.TEST_CREDENTIALS;
    
    // Generate unique PRN
    const prn = `test-${uuidv4().substring(0, 8)}`;
    
    console.log('\n🚀 Starting QR Generation Process');
    console.log('   Amount:', amount);
    console.log('   PRN:', prn);
    console.log('   Merchant Code:', credentials.merchantCode);
    console.log('   Environment:', isLive ? 'LIVE' : 'DEV');

    // Generate signature
    const dataValidation = FonepayUtils.generateQRRequestSignature(
      amount,
      prn,
      credentials.merchantCode,
      remarks1,
      remarks2,
      credentials.secretKey
    );

    // Prepare request payload
    const requestPayload = {
      amount: amount.toString(),
      remarks1,
      remarks2,
      prn,
      merchantCode: credentials.merchantCode,
      dataValidation,
      username: credentials.username,
      password: credentials.password
    };

    // API endpoint
    const baseUrl = isLive ? FONEPAY_CONFIG.LIVE_BASE_URL : FONEPAY_CONFIG.DEV_BASE_URL;
    const apiUrl = `${baseUrl}/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrDownload`;

    console.log('\n📤 Making QR Generation Request:');
    console.log('   URL:', apiUrl);

    // Make API call
    const startTime = Date.now();
    const response = await axios.post(apiUrl, requestPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    response.config = { startTime };

    // Log the API call
    FonepayUtils.logApiCall('POST', apiUrl, { 'Content-Type': 'application/json' }, requestPayload, response);

    // Return response
    res.json({
      success: true,
      data: {
        request: {
          url: apiUrl,
          payload: requestPayload,
          signature: {
            message: `${amount},${prn},${credentials.merchantCode},${remarks1},${remarks2}`,
            secretKey: credentials.secretKey,
            generated: dataValidation
          }
        },
        response: response.data,
        prn: prn,
        websocketUrl: response.data.thirdpartyQrWebSocketUrl
      }
    });

  } catch (error) {
    console.error('❌ QR Generation Error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      }
    });
  }
});

// Check QR Status
app.post('/api/qr/status', async (req, res) => {
  try {
    const { prn, isLive = false, customCredentials } = req.body;

    if (!prn) {
      return res.status(400).json({
        success: false,
        error: 'PRN is required'
      });
    }

    const credentials = customCredentials || FONEPAY_CONFIG.TEST_CREDENTIALS;

    console.log('\n🔍 Checking QR Status:');
    console.log('   PRN:', prn);
    console.log('   Merchant Code:', credentials.merchantCode);

    // Generate signature for status check
    const dataValidation = FonepayUtils.generateCheckStatusSignature(
      prn,
      credentials.merchantCode,
      credentials.secretKey
    );

    // Prepare request payload
    const requestPayload = {
      prn,
      merchantCode: credentials.merchantCode,
      dataValidation,
      username: credentials.username,
      password: credentials.password
    };

    // API endpoint
    const baseUrl = isLive ? FONEPAY_CONFIG.LIVE_BASE_URL : FONEPAY_CONFIG.DEV_BASE_URL;
    const apiUrl = `${baseUrl}/merchant/merchantDetailsForThirdParty/thirdPartyDynamicQrGetStatus`;

    console.log('\n📤 Making Status Check Request:');
    console.log('   URL:', apiUrl);

    // Make API call
    const startTime = Date.now();
    const response = await axios.post(apiUrl, requestPayload, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    response.config = { startTime };

    // Log the API call
    FonepayUtils.logApiCall('POST', apiUrl, { 'Content-Type': 'application/json' }, requestPayload, response);

    res.json({
      success: true,
      data: {
        request: {
          url: apiUrl,
          payload: requestPayload,
          signature: {
            message: `${prn},${credentials.merchantCode}`,
            secretKey: credentials.secretKey,
            generated: dataValidation
          }
        },
        response: response.data
      }
    });

  } catch (error) {
    console.error('❌ Status Check Error:', error);
    
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      }
    });
  }
});

// WebSocket Testing Endpoint
app.post('/api/websocket/test', (req, res) => {
  try {
    const { websocketUrl } = req.body;

    if (!websocketUrl) {
      return res.status(400).json({
        success: false,
        error: 'WebSocket URL is required'
      });
    }

    console.log('\n🔌 Testing WebSocket Connection:');
    console.log('   URL:', websocketUrl);

    const ws = new WebSocket(websocketUrl);
    let connectionResult = {
      connected: false,
      messages: [],
      error: null
    };

    ws.on('open', () => {
      console.log('✅ WebSocket Connected Successfully');
      connectionResult.connected = true;
      
      // Send test message or just listen
      ws.send(JSON.stringify({ 
        type: 'ping', 
        timestamp: new Date().toISOString() 
      }));
    });

    ws.on('message', (data) => {
      const message = data.toString();
      console.log('📨 WebSocket Message Received:', message);
      
      try {
        const parsedMessage = JSON.parse(message);
        connectionResult.messages.push({
          timestamp: new Date().toISOString(),
          data: parsedMessage,
          raw: message
        });
      } catch (e) {
        connectionResult.messages.push({
          timestamp: new Date().toISOString(),
          data: message,
          raw: message
        });
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket Error:', error);
      connectionResult.error = error.message;
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket Connection Closed');
    });

    // Return immediate response and keep connection alive for a short time
    setTimeout(() => {
      res.json({
        success: true,
        data: {
          websocketUrl,
          connection: connectionResult
        }
      });
      
      // Close connection after response
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      }, 5000);
    }, 2000);

  } catch (error) {
    console.error('❌ WebSocket Test Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get configuration
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: {
      endpoints: {
        dev: FONEPAY_CONFIG.DEV_BASE_URL,
        live: FONEPAY_CONFIG.LIVE_BASE_URL
      },
      websocket: {
        dev: FONEPAY_CONFIG.DEV_WEBSOCKET_URL,
        live: FONEPAY_CONFIG.LIVE_WEBSOCKET_URL
      },
      testCredentials: FONEPAY_CONFIG.TEST_CREDENTIALS
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Unhandled Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: error.message
  });
});

// Serve React app for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Fonepay QR Tester Server Started!');
  console.log(`   Server running on: http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('   Ready to test Fonepay APIs! 🎉\n');
  console.log('📚 Development Guide:');
  console.log('   • Production-like: npm start (serves both API + frontend)');
  console.log('   • Development: npm run dev-frontend (hot reload on :3002)');
  console.log('   • Build frontend: npm run build');
});

module.exports = app;