import React, { useState } from 'react';
import JsonView from '@uiw/react-json-view';
import toast from 'react-hot-toast';

const Configuration = ({ config, onConfigUpdate }) => {
  const [activeTab, setActiveTab] = useState('endpoints');
  const [testConnection, setTestConnection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testApiConnection = async (endpoint, environment) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test');
      const data = await response.json();
      
      if (response.ok) {
        setTestConnection({
          status: 'success',
          endpoint,
          environment,
          response: data,
          timestamp: new Date().toISOString()
        });
        toast.success(`${environment} API connection successful!`);
      } else {
        throw new Error('API connection failed');
      }
    } catch (error) {
      setTestConnection({
        status: 'error',
        endpoint,
        environment,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      toast.error(`${environment} API connection failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const validateCredentials = () => {
    if (!config?.testCredentials) {
      toast.error('No credentials available to validate');
      return;
    }

    const { merchantCode, secretKey, username, password } = config.testCredentials;
    const issues = [];

    if (!merchantCode) issues.push('Merchant Code is missing');
    if (!secretKey) issues.push('Secret Key is missing');
    if (!username) issues.push('Username is missing');
    if (!password) issues.push('Password is missing');

    if (merchantCode && merchantCode.length < 3) issues.push('Merchant Code seems too short');
    if (secretKey && secretKey.length < 8) issues.push('Secret Key seems too short');

    if (issues.length === 0) {
      toast.success('✅ Credentials validation passed!');
    } else {
      toast.error(`❌ Validation issues: ${issues.join(', ')}`);
    }
  };

  const refreshConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      
      if (data.success) {
        onConfigUpdate(data.data);
        toast.success('Configuration refreshed successfully');
      } else {
        throw new Error('Failed to refresh configuration');
      }
    } catch (error) {
      toast.error('Failed to refresh configuration');
      console.error('Config refresh error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'endpoints', label: 'API Endpoints', icon: 'fas fa-globe' },
    { id: 'credentials', label: 'Test Credentials', icon: 'fas fa-key' },
    { id: 'websocket', label: 'WebSocket URLs', icon: 'fas fa-plug' },
    { id: 'system', label: 'System Info', icon: 'fas fa-info-circle' }
  ];

  if (!config) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 p-3 rounded-lg">
              <i className="fas fa-cog text-gray-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
              <p className="text-gray-600">API endpoints, credentials, and system configuration</p>
            </div>
          </div>
          
          <button
            onClick={refreshConfig}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <i className="fas fa-sync-alt"></i>
            )}
            <span>Refresh</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
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

      {/* API Endpoints Tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i className="fas fa-globe text-blue-500 mr-2"></i>
              API Endpoints
            </h3>
            
            <div className="space-y-4">
              {/* Development Environment */}
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-green-900">Development Environment</h4>
                    <p className="text-sm text-green-700">For testing and development</p>
                  </div>
                  <button
                    onClick={() => testApiConnection(config.endpoints?.dev, 'Development')}
                    disabled={isLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <i className="fas fa-vial"></i>
                    <span>Test</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-green-800 mb-1">Base URL</label>
                    <div className="bg-white p-2 rounded border text-sm font-mono break-all">
                      {config.endpoints?.dev || 'Not configured'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(config.endpoints?.dev, 'Dev URL')}
                      className="text-green-600 hover:text-green-800 text-xs flex items-center"
                    >
                      <i className="fas fa-copy mr-1"></i>Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Production Environment */}
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-red-900">Production Environment</h4>
                    <p className="text-sm text-red-700">Live production server</p>
                  </div>
                  <button
                    onClick={() => testApiConnection(config.endpoints?.live, 'Production')}
                    disabled={isLoading}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  >
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>Test</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-red-800 mb-1">Base URL</label>
                    <div className="bg-white p-2 rounded border text-sm font-mono break-all">
                      {config.endpoints?.live || 'Not configured'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(config.endpoints?.live, 'Live URL')}
                      className="text-red-600 hover:text-red-800 text-xs flex items-center"
                    >
                      <i className="fas fa-copy mr-1"></i>Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Connection Test Result */}
            {testConnection && (
              <div className="mt-6 p-4 rounded-lg border">
                <h4 className="font-medium mb-2 flex items-center">
                  <i className={`fas mr-2 ${testConnection.status === 'success' ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}`}></i>
                  Connection Test Result
                </h4>
                <JsonView
                  value={testConnection}
                  style={{ backgroundColor: '#f9fafb' }}
                  collapsed={1}
                  displayDataTypes={false}
                  displayObjectSize={false}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Credentials Tab */}
      {activeTab === 'credentials' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <i className="fas fa-key text-yellow-500 mr-2"></i>
              Test Credentials
            </h3>
            <button
              onClick={validateCredentials}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm flex items-center space-x-1"
            >
              <i className="fas fa-shield-alt"></i>
              <span>Validate</span>
            </button>
          </div>

          {config.testCredentials ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center text-yellow-800 text-sm mb-3">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  These are test credentials only. Do not use in production.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Merchant Code
                  </label>
                  <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                    {config.testCredentials.merchantCode}
                  </div>
                  <button
                    onClick={() => copyToClipboard(config.testCredentials.merchantCode, 'Merchant Code')}
                    className="mt-1 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <i className="fas fa-copy mr-1"></i>Copy
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                    {config.testCredentials.username}
                  </div>
                  <button
                    onClick={() => copyToClipboard(config.testCredentials.username, 'Username')}
                    className="mt-1 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <i className="fas fa-copy mr-1"></i>Copy
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secret Key
                  </label>
                  <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                    {'*'.repeat(config.testCredentials.secretKey.length)}
                  </div>
                  <button
                    onClick={() => copyToClipboard(config.testCredentials.secretKey, 'Secret Key')}
                    className="mt-1 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <i className="fas fa-copy mr-1"></i>Copy (Hidden)
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                    {'*'.repeat(config.testCredentials.password.length)}
                  </div>
                  <button
                    onClick={() => copyToClipboard(config.testCredentials.password, 'Password')}
                    className="mt-1 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                  >
                    <i className="fas fa-copy mr-1"></i>Copy (Hidden)
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Usage Instructions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use these credentials for testing API requests</li>
                  <li>• Secret key is used for HMAC signature generation</li>
                  <li>• These work with the development environment only</li>
                  <li>• For production, use your actual Fonepay merchant credentials</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-key text-4xl mb-3"></i>
              <p>No test credentials configured</p>
            </div>
          )}
        </div>
      )}

      {/* WebSocket URLs Tab */}
      {activeTab === 'websocket' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-plug text-purple-500 mr-2"></i>
            WebSocket URLs
          </h3>

          <div className="space-y-4">
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h4 className="font-medium text-green-900 mb-2">Development WebSocket</h4>
              <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                {config.websocket?.dev || 'Not configured'}
              </div>
              <button
                onClick={() => copyToClipboard(config.websocket?.dev, 'Dev WebSocket URL')}
                className="mt-2 text-green-600 hover:text-green-800 text-sm flex items-center"
              >
                <i className="fas fa-copy mr-1"></i>Copy URL
              </button>
            </div>

            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <h4 className="font-medium text-red-900 mb-2">Production WebSocket</h4>
              <div className="bg-white p-3 rounded border font-mono text-sm break-all">
                {config.websocket?.live || 'Not configured'}
              </div>
              <button
                onClick={() => copyToClipboard(config.websocket?.live, 'Live WebSocket URL')}
                className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center"
              >
                <i className="fas fa-copy mr-1"></i>Copy URL
              </button>
            </div>
          </div>

          <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-medium text-purple-900 mb-2">WebSocket Information</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• WebSocket URLs are provided in QR generation responses</li>
              <li>• Use these for real-time payment notifications</li>
              <li>• Connection URLs include unique session identifiers</li>
              <li>• Test WebSocket connections using the WebSocket Tester</li>
            </ul>
          </div>
        </div>
      )}

      {/* System Info Tab */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i className="fas fa-info-circle text-blue-500 mr-2"></i>
            System Information
          </h3>

          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Application Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
                  <div className="bg-gray-50 p-2 rounded border text-sm">Fonepay QR API Tester</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <div className="bg-gray-50 p-2 rounded border text-sm">v1.1</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Version</label>
                  <div className="bg-gray-50 p-2 rounded border text-sm">Dynamic QR v1.1</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                  <div className="bg-gray-50 p-2 rounded border text-sm">Development</div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  'QR Code Generation',
                  'Transaction Status Checking',
                  'WebSocket Testing',
                  'HMAC Signature Generation',
                  'Real-time API Logging',
                  'Request/Response Debugging',
                  'Mock Data Generation',
                  'Configuration Management'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Complete Configuration</h4>
              <div className="bg-gray-50 rounded border p-4">
                <JsonView
                  value={config}
                  style={{ backgroundColor: '#f9fafb' }}
                  collapsed={2}
                  displayDataTypes={false}
                  displayObjectSize={false}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuration;