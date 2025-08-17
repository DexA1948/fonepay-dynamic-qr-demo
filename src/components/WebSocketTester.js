import React, { useState, useRef, useEffect } from 'react';
import ReactJson from '@uiw/react-json-view';
import toast from 'react-hot-toast';

const WebSocketTester = ({ config }) => {
  const [wsUrl, setWsUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState([]);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    if (!wsUrl.trim()) {
      toast.error('Please enter a WebSocket URL');
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      toast.error('WebSocket is already connected');
      return;
    }

    setIsConnecting(true);
    setMessages([]);

    try {
      console.log('🔌 Connecting to WebSocket:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = (event) => {
        console.log('✅ WebSocket Connected');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionInfo({
          url: wsUrl,
          readyState: 'OPEN',
          protocol: wsRef.current.protocol,
          connectedAt: new Date().toISOString()
        });
        
        addMessage({
          type: 'connection',
          direction: 'system',
          data: 'WebSocket connection established',
          timestamp: new Date().toISOString(),
          event: 'onopen'
        });
        
        toast.success('WebSocket connected successfully!');
      };

      wsRef.current.onmessage = (event) => {
        console.log('📨 WebSocket Message:', event.data);
        
        let parsedData;
        try {
          parsedData = JSON.parse(event.data);
        } catch (e) {
          parsedData = event.data;
        }

        addMessage({
          type: 'message',
          direction: 'incoming',
          data: parsedData,
          raw: event.data,
          timestamp: new Date().toISOString(),
          event: 'onmessage'
        });

        // Check if it's a payment notification
        if (typeof parsedData === 'object' && parsedData.transactionStatus) {
          try {
            const transactionStatus = JSON.parse(parsedData.transactionStatus);
            if (transactionStatus.paymentSuccess) {
              toast.success('Payment notification received!', {
                duration: 6000,
                icon: '💳'
              });
            } else if (transactionStatus.QRVerified) {
              toast('QR Code verified!', {
                duration: 4000,
                icon: '✅'
              });
            }
          } catch (e) {
            // Ignore parsing errors for transactionStatus
          }
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket Error:', error);
        setIsConnecting(false);
        
        addMessage({
          type: 'error',
          direction: 'system',
          data: `WebSocket error occurred`,
          timestamp: new Date().toISOString(),
          event: 'onerror',
          error: error.message || 'Unknown error'
        });
        
        toast.error('WebSocket connection error');
      };

      wsRef.current.onclose = (event) => {
        console.log('🔌 WebSocket Closed:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        
        addMessage({
          type: 'connection',
          direction: 'system',
          data: `WebSocket connection closed (Code: ${event.code})`,
          timestamp: new Date().toISOString(),
          event: 'onclose',
          code: event.code,
          reason: event.reason
        });
        
        if (event.code !== 1000) { // Not a normal closure
          toast.error(`WebSocket closed unexpectedly (${event.code})`);
        } else {
          toast('WebSocket connection closed');
        }
      };

    } catch (error) {
      console.error('WebSocket connection error:', error);
      setIsConnecting(false);
      toast.error('Failed to create WebSocket connection');
    }
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
    }
  };

  const sendMessage = (message) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast.error('WebSocket is not connected');
      return;
    }

    try {
      const messageToSend = typeof message === 'object' ? JSON.stringify(message) : message;
      wsRef.current.send(messageToSend);
      
      addMessage({
        type: 'message',
        direction: 'outgoing',
        data: message,
        raw: messageToSend,
        timestamp: new Date().toISOString(),
        event: 'send'
      });
      
      console.log('📤 Sent message:', messageToSend);
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    }
  };

  const addMessage = (message) => {
    setMessages(prev => [...prev, { ...message, id: Date.now() + Math.random() }]);
  };

  const clearMessages = () => {
    setMessages([]);
    toast.success('Messages cleared');
  };

  const loadWebSocketFromQR = () => {
    // Try to get WebSocket URL from a recent QR response
    const lastWebSocketUrl = localStorage.getItem('lastWebSocketUrl');
    if (lastWebSocketUrl) {
      setWsUrl(lastWebSocketUrl);
      toast.success('WebSocket URL loaded from last QR generation');
    } else {
      toast.error('No WebSocket URL found from recent QR generation');
    }
  };

  const testConnection = async () => {
    if (!wsUrl.trim()) {
      toast.error('Please enter a WebSocket URL');
      return;
    }

    try {
      toast.loading('Testing WebSocket connection...', { id: 'ws-test' });
      
      const response = await fetch('/api/websocket/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ websocketUrl: wsUrl }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('WebSocket test completed', { id: 'ws-test' });
        setConnectionInfo(data.data.connection);
      } else {
        toast.error('WebSocket test failed', { id: 'ws-test' });
      }
    } catch (error) {
      toast.error('Test request failed', { id: 'ws-test' });
      console.error('WebSocket test error:', error);
    }
  };

  const getMessageIcon = (message) => {
    switch (message.type) {
      case 'connection':
        return message.data.includes('established') 
          ? 'fas fa-plug text-green-500' 
          : 'fas fa-unlink text-red-500';
      case 'error':
        return 'fas fa-exclamation-triangle text-red-500';
      case 'message':
        return message.direction === 'incoming' 
          ? 'fas fa-arrow-down text-blue-500' 
          : 'fas fa-arrow-up text-green-500';
      default:
        return 'fas fa-info-circle text-gray-500';
    }
  };

  const getMessageBg = (message) => {
    switch (message.type) {
      case 'connection':
        return message.data.includes('established') 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'message':
        return message.direction === 'incoming' 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <i className="fas fa-plug text-purple-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">WebSocket Tester</h2>
              <p className="text-gray-600">Test real-time WebSocket connections for payment notifications</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : isConnecting 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected 
                  ? 'bg-green-500 animate-pulse' 
                  : isConnecting 
                  ? 'bg-yellow-500 animate-pulse'
                  : 'bg-gray-400'
              }`}></div>
              <span>
                {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <i className="fas fa-link text-purple-500 mr-2"></i>
          Connection Setup
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WebSocket URL <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={wsUrl}
                onChange={(e) => setWsUrl(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="wss://example.com/websocket/endpoint"
                disabled={isConnected || isConnecting}
              />
              <button
                onClick={loadWebSocketFromQR}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                disabled={isConnected || isConnecting}
              >
                <i className="fas fa-download mr-1"></i>
                Load from QR
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              <i className="fas fa-info-circle mr-1"></i>
              WebSocket URL is provided in the QR generation response
            </div>
          </div>

          <div className="flex space-x-3">
            {!isConnected && !isConnecting && (
              <>
                <button
                  onClick={connectWebSocket}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                  <i className="fas fa-plug"></i>
                  <span>Connect</span>
                </button>
                <button
                  onClick={testConnection}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                  <i className="fas fa-vial"></i>
                  <span>Test Connection</span>
                </button>
              </>
            )}
            
            {isConnecting && (
              <button
                disabled
                className="bg-yellow-400 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 cursor-not-allowed"
              >
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Connecting...</span>
              </button>
            )}
            
            {isConnected && (
              <>
                <button
                  onClick={disconnectWebSocket}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                  <i className="fas fa-unlink"></i>
                  <span>Disconnect</span>
                </button>
                <button
                  onClick={() => sendMessage({ type: 'ping', timestamp: new Date().toISOString() })}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
                >
                  <i className="fas fa-paper-plane"></i>
                  <span>Send Ping</span>
                </button>
              </>
            )}

            <button
              onClick={clearMessages}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <i className="fas fa-trash"></i>
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Info */}
      {connectionInfo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-info-circle text-blue-500 mr-2"></i>
            Connection Information
          </h3>
          <ReactJson
            src={connectionInfo}
            theme="rjv-default"
            collapsed={false}
            displayDataTypes={false}
            displayObjectSize={false}
          />
        </div>
      )}

      {/* Messages */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <i className="fas fa-comments text-purple-500 mr-2"></i>
            Message Log
            {messages.length > 0 && (
              <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {messages.length}
              </span>
            )}
          </h3>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-inbox text-4xl mb-3"></i>
              <p>No messages yet. Connect to WebSocket to see real-time updates.</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`border rounded-lg p-4 ${getMessageBg(message)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <i className={getMessageIcon(message)}></i>
                    <span className="font-medium text-sm capitalize">
                      {message.type} {message.direction && `(${message.direction})`}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {typeof message.data === 'object' ? (
                  <ReactJson
                    src={message.data}
                    theme="rjv-default"
                    collapsed={2}
                    displayDataTypes={false}
                    displayObjectSize={false}
                    name={false}
                  />
                ) : (
                  <div className="text-sm font-mono bg-white p-2 rounded border">
                    {message.data}
                  </div>
                )}

                {message.raw && message.raw !== JSON.stringify(message.data) && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer">
                      Show raw data
                    </summary>
                    <div className="text-xs font-mono bg-gray-100 p-2 rounded mt-1 break-all">
                      {message.raw}
                    </div>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
          <i className="fas fa-lightbulb mr-2"></i>
          How to Use WebSocket Testing
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-start space-x-2">
            <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">1</span>
            <span>Generate a QR code first to get the WebSocket URL</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">2</span>
            <span>Click "Load from QR" to automatically populate the WebSocket URL</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">3</span>
            <span>Connect to the WebSocket to listen for payment notifications</span>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-blue-200 text-blue-900 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">4</span>
            <span>Scan the QR code with Fonepay app to see real-time payment updates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketTester;