# Fonepay QR API Tester

A comprehensive testing tool for Fonepay Dynamic QR APIs with a beautiful React frontend and robust Node.js backend.

## 🚀 Features

- **QR Code Generation**: Generate dynamic QR codes with real-time preview
- **Transaction Status Checking**: Check payment status using PRN
- **WebSocket Testing**: Real-time payment notifications testing
- **HMAC Signature Generator**: Step-by-step signature generation and validation
- **API Request Logging**: Complete request/response logging with export functionality
- **Configuration Management**: Easy environment and credential management
- **Beautiful UI**: Modern, responsive interface built with React and Tailwind CSS

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

## 🛠️ Installation

1. **Clone or create the project directory**
   ```bash
   mkdir fonepay-qr-tester
   cd fonepay-qr-tester
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install additional React dependencies**
   ```bash
   npm install react@^18.2.0 react-dom@^18.2.0 react-router-dom@^6.15.0 qrcode.react@^3.1.0 react-json-view@^1.21.3 react-hot-toast@^2.4.1
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Build the frontend**
   ```bash
   npm run build
   ```

## 🏗️ Development Architecture

This project uses a **hybrid development setup** with two different modes:

### **Mode 1: Production-like (Single Server)**
**Port: 3000** - All-in-one server serving both API and frontend

```bash
npm start        # Production mode
npm run dev      # Development mode with auto-restart
```

**How it works:**
- Express server serves both API routes (`/api/*`) and React app
- Frontend must be pre-built using `npm run build`
- Single server on port 3000 handles everything
- Simulates production deployment

**Architecture:**
```
┌─────────────────────────────────────┐
│        localhost:3000               │
│  ┌─────────────┐ ┌─────────────────┐│
│  │   Express   │ │  Static React   ││
│  │  API Server │ │     Files       ││
│  │             │ │  (pre-built)    ││
│  └─────────────┘ └─────────────────┘│
└─────────────────────────────────────┘
```

### **Mode 2: Development (Dual Server)**
**Ports: 3000 + 3002** - Separate servers with hot reload

```bash
# Terminal 1: Start API server
npm start

# Terminal 2: Start development frontend
npm run dev-frontend
# Visit: http://localhost:3002
```

**How it works:**
- Express API server runs on port 3000
- Webpack Dev Server runs on port 3002 with hot reload
- Webpack proxies API calls from 3002 → 3000
- No build step needed - live compilation

**Architecture:**
```
┌─────────────────┐    ┌─────────────────┐
│ localhost:3000  │    │ localhost:3002  │
│  ┌───────────┐  │    │  ┌───────────┐  │
│  │  Express  │  │◄───┤  │  Webpack  │  │
│  │API Server │  │    │  │Dev Server │  │
│  └───────────┘  │    │  │(Hot Reload)│  │
└─────────────────┘    │  └───────────┘  │
                       └─────────────────┘
                         Proxy: /api/* → :3000
```

### **Script Commands Explained**

| Command | Description | Use Case |
|---------|-------------|----------|
| `npm start` | Single server (prod-like) | Testing full integration |
| `npm run dev` | Single server + auto-restart | Backend development |
| `npm run dev-frontend` | Dual server + hot reload | Frontend development |
| `npm run build` | Build static files | Prepare for production |
| `npm test` | Run API tests | Verify functionality |

### **When to Use Which Mode**

**Use Single Server Mode (`npm start`) when:**
- Testing complete application flow
- Preparing for production deployment
- Running final integration tests
- Sharing with others (simpler setup)

**Use Development Mode (`npm run dev-frontend`) when:**
- Actively developing React components
- Need instant hot reload
- Working on UI/UX changes
- Debugging frontend issues

### **Key Configuration Files**

**package.json** - Script definitions:
```json
{
  "scripts": {
    "start": "node server.js",           // Single server
    "dev": "nodemon server.js",          // Auto-restart server
    "dev-frontend": "webpack serve",     // Dev server with proxy
    "build": "webpack --mode production" // Build static files
  }
}
```

**webpack.config.js** - Development server config:
```javascript
{
  devServer: {
    port: 3002,                          // Dev server port
    proxy: {
      '/api': 'http://localhost:3000'    // Proxy API calls
    }
  }
}
```

**server.js** - Express routing:
```javascript
// API routes
app.use('/api', apiRoutes);

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
```

## 🏃‍♂️ Running the Application

### Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Build frontend**
   ```bash
   npm run build
   ```

3. **Start application**
   ```bash
   npm start
   # Visit: http://localhost:3000
   ```

### Development Workflow

**For Frontend Development:**
```bash
# Terminal 1: Backend API
npm start

# Terminal 2: Frontend with hot reload
npm run dev-frontend
# Visit: http://localhost:3002
```

**For Backend Development:**
```bash
# Single command with auto-restart
npm run dev
# Visit: http://localhost:3000 (requires build first)
```

### Production Build

```bash
npm run build
npm start
# Visit: http://localhost:3000
```

## 📚 Webpack & Build Process

### **What is Webpack?**
Webpack is a **module bundler** that takes your React code and dependencies and bundles them into static files for the browser.

### **Key Concepts:**

#### **1. Entry Point**
```javascript
// webpack.config.js
entry: './src/index.js'  // Starting point of your React app
```

#### **2. Output**
```javascript
output: {
  path: path.resolve(__dirname, 'public'),  // Where to put bundled files
  filename: 'bundle.js',                    // Name of the bundled file
  clean: true                               // Clean dist folder on each build
}
```

#### **3. Loaders (Transform Files)**
```javascript
module: {
  rules: [
    {
      test: /\.(js|jsx)$/,          // Process .js/.jsx files
      use: 'babel-loader',          // Transform JSX → JavaScript
      exclude: /node_modules/
    },
    {
      test: /\.css$/,               // Process .css files  
      use: ['style-loader', 'css-loader']  // Inject CSS into DOM
    }
  ]
}
```

#### **4. Plugins (Extra Functionality)**
```javascript
plugins: [
  new HtmlWebpackPlugin({
    template: './src/index.html',   // HTML template
    filename: 'index.html'         // Output HTML file
  })
]
```

#### **5. Dev Server (Development Mode)**
```javascript
devServer: {
  static: path.join(__dirname, 'public'),
  port: 3002,
  proxy: {
    '/api': 'http://localhost:3000'    // Proxy API calls to backend
  },
  historyApiFallback: true             // Support React Router
}
```

### **Development vs Production Builds:**

#### **Development Mode:**
```bash
npm run dev-frontend  # webpack serve --mode development
```
- **Hot Module Replacement (HMR)** - Changes instantly reflected
- **Source Maps** - Debug original code, not bundled code
- **Fast Compilation** - Code compiled in memory
- **Proxy Support** - API calls forwarded to backend server

#### **Production Mode:**
```bash
npm run build  # webpack --mode production
```
- **Minification** - Smaller file sizes
- **Tree Shaking** - Remove unused code
- **Asset Optimization** - Compress images, CSS
- **File Hashing** - Cache busting for deployments

### **How the Proxy Works:**

```javascript
// Frontend makes API call
fetch('/api/qr/generate', { ... })

// Webpack dev server receives request on port 3002
// Sees '/api' pattern → forwards to 'http://localhost:3000'
// Backend processes request on port 3000
// Response flows back: 3000 → 3002 → browser
```

## 📖 API Documentation

### QR Generation

**Endpoint**: `POST /api/qr/generate`

**Request Body**:
```json
{
  "amount": "100.50",
  "remarks1": "Test Transaction",
  "remarks2": "API Test",
  "isLive": false,
  "customCredentials": {
    "merchantCode": "your-merchant-code",
    "secretKey": "your-secret-key",
    "username": "your-username",
    "password": "your-password"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "request": { ... },
    "response": {
      "message": "successfull",
      "qrMessage": "QR_CODE_DATA",
      "status": "CREATED",
      "statusCode": 201,
      "success": true,
      "thirdpartyQrWebSocketUrl": "WEBSOCKET_URL"
    },
    "prn": "generated-prn",
    "websocketUrl": "WEBSOCKET_URL"
  }
}
```

### Status Check

**Endpoint**: `POST /api/qr/status`

**Request Body**:
```json
{
  "prn": "transaction-prn",
  "isLive": false,
  "customCredentials": { ... }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "request": { ... },
    "response": {
      "fonepayTraceId": 17404,
      "merchantCode": "fonepay123",
      "paymentStatus": "success",
      "prn": "transaction-prn"
    }
  }
}
```

## 🔐 HMAC Signature Generation

The application generates HMAC-SHA512 signatures as required by Fonepay:

### QR Request Signature
```
Message: amount,prn,merchantCode,remarks1,remarks2
Example: 100.50,test-abc123,fonepay123,Test Transaction,API Test
```

### Status Check Signature
```
Message: prn,merchantCode
Example: test-abc123,fonepay123
```

## 🌐 WebSocket Integration

The application supports real-time WebSocket connections for payment notifications:

1. Generate a QR code to get the WebSocket URL
2. Connect to the WebSocket using the provided URL
3. Listen for payment verification and completion notifications

**WebSocket Message Types**:
- **QR Verification**: When QR is scanned
- **Payment Success**: When payment is completed
- **Payment Failed**: When payment fails

## 🔧 Configuration

### Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode
- `FONEPAY_DEV_URL`: Development API URL
- `FONEPAY_LIVE_URL`: Production API URL
- Test credentials for development

### Test Credentials

The application includes test credentials from the Fonepay documentation:
- Merchant Code: `fonepay123`
- Secret Key: `fonepay`
- Username: `bijayk`
- Password: `password`

## 📱 User Interface

### QR Generator
- Generate QR codes with amount and remarks
- Real-time QR code preview
- Signature generation details
- Copy QR data and PRN

### Status Checker
- Check transaction status using PRN
- Load previous PRN automatically
- Detailed response information

### WebSocket Tester
- Connect to WebSocket URLs
- Real-time message logging
- Connection status monitoring
- Mock message sending

### Signature Generator
- Generate HMAC signatures manually
- Step-by-step process visualization
- Signature validation
- Code examples

### API Logs
- Complete request/response logging
- Filter and search functionality
- Export logs as JSON
- Mock data generation

### Configuration
- View API endpoints
- Test credentials management
- System information
- Connection testing

## 🛡️ Security Notes

- Never expose secret keys in frontend code
- Generate signatures on the backend only
- Use HTTPS for all production communications
- Store credentials securely
- Validate all inputs before processing

## 🚨 Error Handling

The application handles various error scenarios:
- Invalid credentials
- Network connectivity issues
- Malformed requests
- API rate limiting
- WebSocket connection failures

## 📊 Logging

All API requests and responses are logged with:
- Timestamp
- Request/response headers and body
- Status codes
- Duration
- Error details

## 🧪 Testing

### Manual Testing
1. Use the UI to generate QR codes
2. Check transaction status
3. Test WebSocket connections
4. Validate HMAC signatures

### Mock Data
The application includes mock data generators for testing the interface without making actual API calls.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For issues related to:
- **Fonepay APIs**: Contact Fonepay support
- **This Testing Tool**: Create an issue in the repository

## 🔗 Useful Links

- [Fonepay Documentation](https://fonepay.com/)
- [React Documentation](https://reactjs.org/)
- [Node.js Documentation](https://nodejs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

**⚠️ Disclaimer**: This is a testing tool for development purposes. Always use official Fonepay documentation and follow security best practices for production implementations.