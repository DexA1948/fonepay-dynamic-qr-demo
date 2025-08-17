import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import QRCodeGenerator from './components/QRCodeGenerator';
import StatusChecker from './components/StatusChecker';
import WebSocketTester from './components/WebSocketTester';
import SignatureGenerator from './components/SignatureGenerator';
import ApiLogs from './components/ApiLogs';
import Configuration from './components/Configuration';

const App = () => {
  const location = useLocation();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config');
      const data = await response.json();
      if (data.success) {
        setConfig(data.data);
      }
    } catch (error) {
      toast.error('Failed to load configuration');
      console.error('Config error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigationItems = [
    { path: '/', label: 'QR Generator', icon: 'fas fa-qrcode' },
    { path: '/status', label: 'Status Checker', icon: 'fas fa-search' },
    { path: '/websocket', label: 'WebSocket Test', icon: 'fas fa-plug' },
    { path: '/signature', label: 'Signature Gen', icon: 'fas fa-key' },
    { path: '/logs', label: 'API Logs', icon: 'fas fa-list' },
    { path: '/config', label: 'Configuration', icon: 'fas fa-cog' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading Fonepay QR Tester...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="gradient-bg text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="bg-white p-2 rounded-lg mr-3">
                <i className="fas fa-mobile-alt text-blue-600 text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Fonepay QR Tester</h1>
                <p className="text-blue-100 text-sm">Dynamic QR API Testing Tool</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/10 px-3 py-1 rounded-full">
                <span className="text-sm">v1.1</span>
              </div>
              <div className="bg-green-500 w-3 h-3 rounded-full pulse-dot"></div>
              <span className="text-sm">Server Online</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                  location.pathname === item.path
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route 
            path="/" 
            element={<QRCodeGenerator config={config} />} 
          />
          <Route 
            path="/status" 
            element={<StatusChecker config={config} />} 
          />
          <Route 
            path="/websocket" 
            element={<WebSocketTester config={config} />} 
          />
          <Route 
            path="/signature" 
            element={<SignatureGenerator config={config} />} 
          />
          <Route 
            path="/logs" 
            element={<ApiLogs />} 
          />
          <Route 
            path="/config" 
            element={<Configuration config={config} onConfigUpdate={setConfig} />} 
          />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="bg-blue-100 p-2 rounded-lg">
                <i className="fas fa-code text-blue-600"></i>
              </div>
              <div>
                <p className="text-gray-900 font-medium">Fonepay API Tester</p>
                <p className="text-gray-600 text-sm">Built for testing Fonepay Dynamic QR APIs</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <i className="fas fa-shield-alt text-green-500"></i>
                <span>Secure Testing</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-clock text-blue-500"></i>
                <span>Real-time</span>
              </div>
              <div className="flex items-center space-x-1">
                <i className="fas fa-bug text-purple-500"></i>
                <span>Debug Mode</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;