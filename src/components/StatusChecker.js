import React, { useState, useEffect } from 'react';
import JsonView from '@uiw/react-json-view';
import toast from 'react-hot-toast';

const StatusChecker = ({ config }) => {
  const [formData, setFormData] = useState({
    prn: '',
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

  useEffect(() => {
    // Load last PRN from localStorage if available
    const lastPRN = localStorage.getItem('lastPRN');
    if (lastPRN) {
      setFormData(prev => ({ ...prev, prn: lastPRN }));
    }
  }, []);

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

  const checkStatus = async () => {
    if (!formData.prn.trim()) {
      toast.error('Please enter a PRN');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        prn: formData.prn.trim(),
        isLive: formData.isLive,
        customCredentials: formData.useCustomCredentials ? formData.customCredentials : null
      };

      console.log('🔍 Checking status with payload:', payload);

      const response = await fetch('/api/qr/status', {
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
        
        const status = data.data.response.paymentStatus;
        if (status === 'success') {
          toast.success('Payment successful!');
        } else if (status === 'failed') {
          toast.error('Payment failed');
        } else if (status === 'pending') {
          toast('Payment is pending', { icon: '⏳' });
        } else {
          toast.success('Status retrieved successfully');
        }
      } else {
        toast.error(data.error?.message || 'Status check failed');
        setResult({ error: data.error });
        setActiveTab('result');
      }
    } catch (error) {
      console.error('Status Check Error:', error);
      toast.error('Network error occurred');
      setResult({ error: { message: error.message } });
      setActiveTab('result');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      success: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      default: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const icons = {
      success: 'fas fa-check-circle',
      failed: 'fas fa-times-circle',
      pending: 'fas fa-clock',
      default: 'fas fa-question-circle'
    };

    const badgeClass = badges[status] || badges.default;
    const icon = icons[status] || icons.default;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${badgeClass}`}>
        <i className={`${icon} mr-2`}></i>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    );
  };

  const tabs = [
    { id: 'form', label: 'Check Status', icon: 'fas fa-search' },
    { id: 'result', label: 'Result', icon: 'fas fa-eye', disabled: !result },
    { id: 'signature', label: 'Signature Details', icon: 'fas fa-key', disabled: !result }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <i className="fas fa-search text-green-600 text-xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transaction Status Checker</h2>
            <p className="text-gray-600">Check the status of QR transactions using PRN</p>
          </div>
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
                    ? 'border-green-500 text-green-600'
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Search Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fas fa-search text-green-500 mr-2"></i>
                Search Details
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Reference Number (PRN) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="prn"
                  value={formData.prn}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter PRN (e.g., test-abc123def)"
                  required
                />
                <div className="mt-2 text-xs text-gray-500">
                  <i className="fas fa-info-circle mr-1"></i>
                  PRN is the unique identifier returned during QR generation
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isLive"
                  checked={formData.isLive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Use Live Environment
                  <span className="text-red-500 text-xs ml-1">(Use with caution!)</span>
                </label>
              </div>

              {/* Quick Actions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Quick Actions</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const lastPRN = localStorage.getItem('lastPRN');
                      if (lastPRN) {
                        setFormData(prev => ({ ...prev, prn: lastPRN }));
                        toast.success('Last PRN loaded');
                      } else {
                        toast.error('No previous PRN found');
                      }
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <i className="fas fa-history mr-1"></i>
                    Load Last PRN
                  </button>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, prn: '' }))}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <i className="fas fa-eraser mr-1"></i>
                    Clear PRN
                  </button>
                </div>
              </div>
            </div>

            {/* Credentials */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <i className="fas fa-user-shield text-green-500 mr-2"></i>
                Authentication
              </h3>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="useCustomCredentials"
                  checked={formData.useCustomCredentials}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Merchant Code"
                  />
                  
                  <input
                    type="password"
                    name="custom.secretKey"
                    value={formData.customCredentials.secretKey}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Secret Key"
                  />
                  
                  <input
                    type="text"
                    name="custom.username"
                    value={formData.customCredentials.username}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Username"
                  />
                  
                  <input
                    type="password"
                    name="custom.password"
                    value={formData.customCredentials.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
          </div>

          {/* Check Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={checkStatus}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-8 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-search"></i>
                  <span>Check Status</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Result Tab */}
      {activeTab === 'result' && result && (
        <div className="space-y-6">
          {result.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center text-red-800 mb-4">
                <i className="fas fa-exclamation-circle text-xl mr-3"></i>
                <h3 className="text-lg font-semibold">Error Occurred</h3>
              </div>
              <JsonView
                value={result.error}
                collapsed={false}
                displayDataTypes={false}
                style={{
                  backgroundColor: 'transparent',
                  fontSize: '14px'
                }}
              />
            </div>
          ) : (
            <>
              {/* Status Summary */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <i className="fas fa-chart-line text-green-500 mr-2"></i>
                  Status Summary
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Payment Status</div>
                    <div>
                      {getStatusBadge(result.response?.paymentStatus)}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">PRN</div>
                    <div className="font-mono text-sm break-all">
                      {result.response?.prn}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Trace ID</div>
                    <div className="font-mono text-sm">
                      {result.response?.fonepayTraceId || 'N/A'}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Merchant Code</div>
                    <div className="font-mono text-sm">
                      {result.response?.merchantCode}
                    </div>
                  </div>
                </div>
              </div>

              {/* API Request */}
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

              {/* API Response */}
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
                    {result.request.signature.message}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    Format: PRN,MERCHANT-CODE
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-purple-800">Step 2 - Secret Key:</span>
                  <div className="bg-white p-2 rounded border mt-1 font-mono text-xs">
                    {result.request.signature.secretKey}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-purple-800">Step 3 - HMAC SHA512 Result:</span>
                  <div className="bg-white p-2 rounded border mt-1 font-mono text-xs break-all">
                    {result.request.signature.generated}
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
      )}
    </div>
  );
};

export default StatusChecker;