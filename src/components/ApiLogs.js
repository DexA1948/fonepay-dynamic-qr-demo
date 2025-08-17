import React, { useState, useEffect } from 'react';
import JsonView from '@uiw/react-json-view';
import toast from 'react-hot-toast';

const ApiLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
    
    // Auto-refresh logs every 5 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadLogs, 5000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, filter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/logs?type=${filter}&limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs);
      } else {
        throw new Error('Failed to fetch logs');
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load API logs');
    } finally {
      setLoading(false);
    }
  };

  const clearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all API logs?')) {
      return;
    }

    try {
      const response = await fetch('/api/logs', { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setLogs([]);
        toast.success('Logs cleared successfully');
      } else {
        throw new Error('Failed to clear logs');
      }
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast.error('Failed to clear logs');
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fonepay-api-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported successfully');
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.request.body).toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.response.body).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    if (status >= 200 && status < 300) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (status >= 400 && status < 500) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (status >= 500) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else {
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'QR_GENERATION':
        return 'fas fa-qrcode text-blue-500';
      case 'STATUS_CHECK':
        return 'fas fa-search text-green-500';
      default:
        return 'fas fa-globe text-gray-500';
    }
  };

  const formatDuration = (duration) => {
    if (duration < 1000) {
      return `${duration}ms`;
    } else {
      return `${(duration / 1000).toFixed(2)}s`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <i className="fas fa-list-alt text-purple-600 text-xl"></i>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">API Logs</h2>
              <p className="text-gray-600">Monitor real-time API calls and responses</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                autoRefresh 
                  ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <i className={`fas ${autoRefresh ? 'fa-pause' : 'fa-play'}`}></i>
              <span>{autoRefresh ? 'Stop Auto Refresh' : 'Auto Refresh'}</span>
            </button>
            
            <button
              onClick={loadLogs}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 transition-colors duration-200"
            >
              <i className={`fas fa-sync-alt ${loading ? 'animate-spin' : ''}`}></i>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="qr_generation">QR Generation</option>
              <option value="status_check">Status Check</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Search logs..."
            />
          </div>
          
          <div className="flex items-end space-x-2">
            <button
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 transition-colors duration-200"
            >
              <i className="fas fa-download"></i>
              <span>Export</span>
            </button>
            
            <button
              onClick={clearLogs}
              disabled={logs.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center space-x-2 transition-colors duration-200"
            >
              <i className="fas fa-trash"></i>
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-lg shadow-md">
        {loading && logs.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-inbox text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No API logs found</h3>
            <p className="text-gray-600">
              {logs.length === 0 
                ? 'Start making API calls to see logs here.' 
                : 'No logs match your current filter criteria.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <i className={getTypeIcon(log.type)}></i>
                    <div>
                      <div className="font-medium text-gray-900">{log.type.replace('_', ' ')}</div>
                      <div className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                    <span className="text-sm text-gray-500">{formatDuration(log.duration)}</span>
                    <button
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                    >
                      {expandedLog === log.id ? 'Collapse' : 'Details'}
                    </button>
                  </div>
                </div>

                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-mono">{log.method}</span> {log.url}
                </div>

                {expandedLog === log.id && (
                  <div className="space-y-4 mt-4">
                    {/* Request Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <i className="fas fa-upload text-indigo-500 mr-2"></i>
                        Request
                      </h4>
                      <div className="bg-gray-50 rounded border p-3">
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-600 mb-1">Headers</div>
                          <JsonView
                            value={log.request.headers}
                            style={{ backgroundColor: 'transparent', fontSize: '12px' }}
                            displayDataTypes={false}
                            displayObjectSize={false}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">Body</div>
                          <JsonView
                            value={log.request.body}
                            style={{ backgroundColor: 'transparent', fontSize: '12px' }}
                            displayDataTypes={false}
                            displayObjectSize={false}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Response Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <i className="fas fa-download text-green-500 mr-2"></i>
                        Response
                      </h4>
                      <div className="bg-gray-50 rounded border p-3">
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-600 mb-1">Status: {log.response.status}</div>
                        </div>
                        <div className="mb-3">
                          <div className="text-xs font-medium text-gray-600 mb-1">Headers</div>
                          <JsonView
                            value={log.response.headers}
                            style={{ backgroundColor: 'transparent', fontSize: '12px' }}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            collapsed={1}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-600 mb-1">Body</div>
                          <JsonView
                            value={log.response.body}
                            style={{ backgroundColor: 'transparent', fontSize: '12px' }}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            collapsed={1}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiLogs;