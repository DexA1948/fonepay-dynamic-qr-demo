import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode.react';
import JsonView from '@uiw/react-json-view';
import toast from 'react-hot-toast';

const QRCodeGenerator = ({ config }) => {
  const [formData, setFormData] = useState({
    amount: '',
    remarks1: 'Test Transaction',
    remarks2: 'API Test',
    isLive: false,
    useCustomCredentials: false,
    customCredentials: {
      merchantCode: '',
      secretKey: '',
      username: '',
      password: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('form');
  const [wsConnection, setWsConnection] = useState(null);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [wsMessages, setWsMessages] = useState([]);
  const [transactionActive, setTransactionActive] = useState(false);
  const wsRef = useRef(null);

  // Generate real-time payload preview
  const getPayloadPreview = () => {
    const credentials = formData.useCustomCredentials 
      ? formData.customCredentials 
      : config?.testCredentials || {};
    
    return {
      amount: formData.amount || '0',
      remarks1: formData.remarks1,
      remarks2: formData.remarks2,
      prn: '<generated-at-submit>',
      merchantCode: credentials.merchantCode || 'fonepay123',
      dataValidation: '<hmac-signature>',
      username: credentials.username || 'bijayk',
      password: '***'
    };
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('custom.')) {
      const fieldName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        customCredentials: {
          ...prev.customCredentials,
          [fieldName]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // WebSocket connection management
  const connectWebSocket = (url) => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    console.log('Connecting to WebSocket:', url);
    setWsStatus('connecting');
    setWsMessages([]);

    try {
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsStatus('connected');
        toast.success('WebSocket connected for transaction tracking');
        
        // Send initial message if required by Fonepay
        if (result?.prn) {
          const initMessage = {
            prn: result.prn,
            merchantCode: result.request?.payload?.merchantCode || 'fonepay123'
          };
          
          try {
            ws.send(JSON.stringify(initMessage));
            setWsMessages(prev => [...prev, {
              type: 'sent',
              timestamp: new Date().toISOString(),
              data: initMessage
            }]);
          } catch (err) {
            console.error('Failed to send init message:', err);
          }
        }
      };

      ws.onmessage = (event) => {
        console.log('WebSocket message:', event.data);
        try {
          const data = JSON.parse(event.data);
          setWsMessages(prev => [...prev, {
            type: 'received',
            timestamp: new Date().toISOString(),
            data
          }]);
          
          // Check for transaction completion
          if (data.status === 'SUCCESS' || data.transactionStatus === 'SUCCESS') {
            toast.success('Transaction completed successfully!');
          } else if (data.status === 'FAILED' || data.transactionStatus === 'FAILED') {
            toast.error('Transaction failed');
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
          // Handle plain text messages
          setWsMessages(prev => [...prev, {
            type: 'received',
            timestamp: new Date().toISOString(),
            data: { message: event.data }
          }]);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsStatus('error');
        toast.error('WebSocket connection error - this is normal in test environment');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsStatus('disconnected');
      };

      wsRef.current = ws;
      setWsConnection(ws);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setWsStatus('error');
      toast.error('Failed to create WebSocket connection');
    }
  };

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
    };
  }, []);

  const generateQR = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setTransactionActive(true);
    
    try {
      const payload = {
        amount: formData.amount,
        remarks1: formData.remarks1,
        remarks2: formData.remarks2,
        isLive: formData.isLive,
        customCredentials: formData.useCustomCredentials ? formData.customCredentials : null
      };

      console.log('🚀 Generating QR with payload:', payload);

      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
        setActiveTab('result');
        toast.success('QR Code generated successfully!');
        
        // Store PRN for later use
        localStorage.setItem('lastPRN', data.data.prn);
        
        // Automatically connect to WebSocket if URL is provided
        if (data.data.websocketUrl || data.data.response?.thirdpartyQrWebSocketUrl) {
          const wsUrl = data.data.websocketUrl || data.data.response?.thirdpartyQrWebSocketUrl;
          setTimeout(() => {
            connectWebSocket(wsUrl);
          }, 1000);
        }
      } else {
        toast.error(data.error?.message || 'QR generation failed');
        setResult({ error: data.error });
        setActiveTab('result');
        setTransactionActive(false);
      }
    } catch (error) {
      console.error('QR Generation Error:', error);
      toast.error('Network error occurred');
      setResult({ error: { message: error.message } });
      setActiveTab('result');
      setTransactionActive(false);
    } finally {
      setLoading(false);
    }
  };

  const startNewTransaction = () => {
    setResult(null);
    setTransactionActive(false);
    setWsMessages([]);
    setWsStatus('disconnected');
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    setActiveTab('form');
    toast.success('Ready for new transaction');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const tabs = [
    { id: 'form', label: 'Generate QR', icon: 'fas fa-plus' },
    { id: 'result', label: 'Result', icon: 'fas fa-eye', disabled: !result },
    { id: 'signature', label: 'Signature Details', icon: 'fas fa-key', disabled: !result },
    { id: 'tracking', label: 'Live Tracking', icon: 'fas fa-broadcast-tower', disabled: !result }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <i className="fas fa-qrcode text-blue-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">QR Code Generator</h2>
              <p className="text-gray-600">Generate dynamic QR codes for Fonepay transactions</p>
            </div>
          </div>
          {transactionActive && (
            <button
              onClick={startNewTransaction}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <i className="fas fa-plus-circle"></i>
              <span>Start New Transaction</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : tab.disabled
                    ? 'border-transparent text-gray-400 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Form Tab */}
      {activeTab === 'form' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fas fa-info-circle text-blue-500 mr-2"></i>
                Transaction Details
              </h3>
              
              {transactionActive && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <i className="fas fa-lock mr-2"></i>
                    Transaction is active. Click "Start New Transaction" to modify fields.
                  </p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  disabled={transactionActive}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Enter amount (e.g., 100.50)"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks 1
                </label>
                <input
                  type="text"
                  name="remarks1"
                  value={formData.remarks1}
                  onChange={handleInputChange}
                  disabled={transactionActive}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Transaction description"
                  maxLength="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks 2
                </label>
                <input
                  type="text"
                  name="remarks2"
                  value={formData.remarks2}
                  onChange={handleInputChange}
                  disabled={transactionActive}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Additional description"
                  maxLength="25"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isLive"
                  checked={formData.isLive}
                  onChange={handleInputChange}
                  disabled={transactionActive}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Use Live Environment
                  <span className="text-red-500 text-xs ml-1">(Use with caution!)</span>
                </label>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                  <i className="fas fa-user-shield text-green-500 mr-2"></i>
                  Authentication
                </h3>

                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    name="useCustomCredentials"
                    checked={formData.useCustomCredentials}
                    onChange={handleInputChange}
                    disabled={transactionActive}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Use Custom Credentials
                  </label>
                </div>

                {formData.useCustomCredentials ? (
                  <div className="space-y-3 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <div className="flex items-center text-yellow-800 text-sm">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      Using custom credentials
                    </div>
                    
                    <input
                      type="text"
                      name="custom.merchantCode"
                      value={formData.customCredentials.merchantCode}
                      onChange={handleInputChange}
                      disabled={transactionActive}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Merchant Code"
                    />
                    
                    <input
                      type="password"
                      name="custom.secretKey"
                      value={formData.customCredentials.secretKey}
                      onChange={handleInputChange}
                      disabled={transactionActive}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Secret Key"
                    />
                    
                    <input
                      type="text"
                      name="custom.username"
                      value={formData.customCredentials.username}
                      onChange={handleInputChange}
                      disabled={transactionActive}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Username"
                    />
                    
                    <input
                      type="password"
                      name="custom.password"
                      value={formData.customCredentials.password}
                      onChange={handleInputChange}
                      disabled={transactionActive}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Password"
                    />
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center text-green-800 text-sm mb-2">
                      <i className="fas fa-check-circle mr-2"></i>
                      Using test credentials
                    </div>
                    {config?.testCredentials && (
                      <div className="text-xs text-green-700 space-y-1">
                        <div>Merchant: {config.testCredentials.merchantCode}</div>
                        <div>Username: {config.testCredentials.username}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Generate Button */}
              <div className="mt-6">
                <button
                  onClick={generateQR}
                  disabled={loading || transactionActive}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-8 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Generating...</span>
                    </>
                  ) : transactionActive ? (
                    <>
                      <i className="fas fa-lock"></i>
                      <span>Transaction Active</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-qrcode"></i>
                      <span>Generate QR Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Real-time Payload Preview */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <i className="fas fa-code text-purple-500 mr-2"></i>
              Request Payload Preview
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">
                This is what will be sent to the API:
              </div>
              <JsonView
                value={getPayloadPreview()}
                style={{ backgroundColor: '#f9fafb', fontSize: '14px' }}
                displayDataTypes={false}
                displayObjectSize={false}
              />
            </div>

            <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-800">
                <i className="fas fa-info-circle mr-2"></i>
                <strong>Note:</strong> The PRN (Product Reference Number) and HMAC signature will be generated automatically when you submit the form.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result Tab - Always show API Request/Response if result exists */}
      {(activeTab === 'result' || (result && !result.error)) && result && (
        <div className="space-y-6">
          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center text-red-800 mb-4">
                <i className="fas fa-exclamation-circle text-xl mr-3"></i>
                <h3 className="text-lg font-semibold">Error Occurred</h3>
              </div>
              <JsonView
                value={result.error}
                style={{ backgroundColor: '#fef2f2' }}
                displayDataTypes={false}
                displayObjectSize={false}
              />
            </div>
          ) : (
            <>
              {/* QR Code Display - Only show on result tab */}
              {activeTab === 'result' && result.response?.qrMessage && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i className="fas fa-qrcode text-blue-500 mr-2"></i>
                    Generated QR Code
                  </h3>
                  
                  <div className="flex flex-col lg:flex-row items-start space-y-4 lg:space-y-0 lg:space-x-6">
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                      <QRCode
                        value={result.response.qrMessage}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          QR Data
                        </label>
                        <div className="bg-gray-50 p-3 rounded border text-xs font-mono break-all">
                          {result.response.qrMessage}
                        </div>
                        <button
                          onClick={() => copyToClipboard(result.response.qrMessage)}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <i className="fas fa-copy mr-1"></i>
                          Copy QR Data
                        </button>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Product Reference Number (PRN)
                        </label>
                        <div className="bg-blue-50 p-3 rounded border text-sm font-mono">
                          {result.prn}
                        </div>
                        <button
                          onClick={() => copyToClipboard(result.prn)}
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                        >
                          <i className="fas fa-copy mr-1"></i>
                          Copy PRN
                        </button>
                      </div>

                      {(result.websocketUrl || result.response?.thirdpartyQrWebSocketUrl) && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            WebSocket Status
                          </label>
                          <div className={`p-3 rounded border ${
                            wsStatus === 'connected' ? 'bg-green-50 border-green-200' :
                            wsStatus === 'connecting' ? 'bg-yellow-50 border-yellow-200' :
                            wsStatus === 'error' ? 'bg-red-50 border-red-200' :
                            'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium ${
                                wsStatus === 'connected' ? 'text-green-800' :
                                wsStatus === 'connecting' ? 'text-yellow-800' :
                                wsStatus === 'error' ? 'text-red-800' :
                                'text-gray-800'
                              }`}>
                                <i className={`fas ${
                                  wsStatus === 'connected' ? 'fa-check-circle' :
                                  wsStatus === 'connecting' ? 'fa-spinner fa-spin' :
                                  wsStatus === 'error' ? 'fa-exclamation-circle' :
                                  'fa-times-circle'
                                } mr-2`}></i>
                                {wsStatus.charAt(0).toUpperCase() + wsStatus.slice(1)}
                              </span>
                              {wsStatus === 'disconnected' && (
                                <button
                                  onClick={() => connectWebSocket(result.websocketUrl || result.response?.thirdpartyQrWebSocketUrl)}
                                  className="text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <i className="fas fa-plug mr-1"></i>
                                  Connect
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* API Request - Always show if result exists */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="fas fa-upload text-indigo-500 mr-2"></i>
                  API Request
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Endpoint</label>
                    <div className="bg-gray-50 p-3 rounded border text-sm font-mono break-all">
                      {result.request?.url || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Request Body</label>
                    <div className="bg-gray-50 rounded border p-3">
                      <JsonView
                        value={result.request?.payload || {}}
                        style={{ backgroundColor: '#f9fafb' }}
                        displayDataTypes={false}
                        displayObjectSize={false}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* API Response - Always show if result exists */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="fas fa-download text-green-500 mr-2"></i>
                  API Response
                </h3>
                <div className="bg-gray-50 rounded border p-3">
                  <JsonView
                    value={result.response || {}}
                    style={{ backgroundColor: '#f9fafb' }}
                    displayDataTypes={false}
                    displayObjectSize={false}
                    collapsed={1}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Signature Tab */}
      {activeTab === 'signature' && result && !result.error && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-key text-purple-500 mr-2"></i>
              HMAC Signature Details
            </h3>
            
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-3">Signature Generation Process</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-purple-800">Step 1 - Message Formation:</span>
                    <div className="bg-white p-2 rounded border mt-1 font-mono text-xs">
                      {result.request?.signature?.message || 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-purple-800">Step 2 - Secret Key:</span>
                    <div className="bg-white p-2 rounded border mt-1 font-mono text-xs">
                      {result.request?.signature?.secretKey || 'N/A'}
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-purple-800">Step 3 - HMAC SHA512 Result:</span>
                    <div className="bg-white p-2 rounded border mt-1 font-mono text-xs break-all">
                      {result.request?.signature?.generated || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Complete Request Payload</h4>
                <JsonView
                  value={result.request?.payload || {}}
                  style={{ backgroundColor: '#f9fafb' }}
                  displayDataTypes={false}
                  displayObjectSize={false}
                />
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Live Tracking Tab */}
      {activeTab === 'tracking' && result && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fas fa-broadcast-tower text-orange-500 mr-2"></i>
                Live Transaction Tracking
              </h3>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                wsStatus === 'connected' ? 'bg-green-100 text-green-800' :
                wsStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                wsStatus === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                <i className={`fas ${
                  wsStatus === 'connected' ? 'fa-circle text-green-500' :
                  wsStatus === 'connecting' ? 'fa-spinner fa-spin text-yellow-500' :
                  wsStatus === 'error' ? 'fa-exclamation-circle text-red-500' :
                  'fa-circle text-gray-500'
                } mr-2`}></i>
                {wsStatus}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">WebSocket URL:</div>
                <div className="font-mono text-xs break-all">
                  {result.websocketUrl || result.response?.thirdpartyQrWebSocketUrl || 'No WebSocket URL available'}
                </div>
                {wsStatus === 'error' && (
                  <div className="mt-2 text-xs text-orange-600">
                    <i className="fas fa-info-circle mr-1"></i>
                    WebSocket errors are normal in test environment. In production, ensure proper credentials and network access.
                  </div>
                )}
              </div>

              {wsMessages.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Message Log:</h4>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {wsMessages.map((msg, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        msg.type === 'sent' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-medium ${
                            msg.type === 'sent' ? 'text-blue-700' : 'text-green-700'
                          }`}>
                            <i className={`fas ${msg.type === 'sent' ? 'fa-upload' : 'fa-download'} mr-1`}></i>
                            {msg.type === 'sent' ? 'Sent' : 'Received'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <JsonView
                          value={msg.data}
                          style={{ backgroundColor: 'transparent' }}
                          displayDataTypes={false}
                          displayObjectSize={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-inbox text-4xl mb-3"></i>
                  <p>No messages yet. Waiting for transaction updates...</p>
                  {wsStatus === 'disconnected' && (
                    <button
                      onClick={() => connectWebSocket(result.websocketUrl || result.response?.thirdpartyQrWebSocketUrl)}
                      className="mt-4 text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center"
                    >
                      <i className="fas fa-plug mr-1"></i>
                      Connect to WebSocket
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default QRCodeGenerator;