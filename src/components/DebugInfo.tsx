import React, { useState } from 'react';
import api from '../utils/api';

const DebugInfo: React.FC = () => {
  const [apiInfo, setApiInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    try {
      console.log('Testing API connection...');
      console.log('API Base URL:', process.env.REACT_APP_API_URL);
      console.log('Environment:', process.env.NODE_ENV);
      
      // Test the health endpoint
      const response = await api.get('/health');
      setApiInfo(response.data);
      console.log('API Health Response:', response.data);
    } catch (error: any) {
      console.error('API Test Failed:', error);
      setApiInfo({
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: {
          baseURL: error.config?.baseURL,
          url: error.config?.url,
          method: error.config?.method
        }
      });
    }
    setLoading(false);
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-md">
      <h3 className="font-bold mb-2">Debug Info</h3>
      <div className="text-sm mb-2">
        <p><strong>API URL:</strong> {process.env.REACT_APP_API_URL || 'Not set'}</p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
      </div>
      <button 
        onClick={testAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-3 py-1 rounded text-sm mb-2"
      >
        {loading ? 'Testing...' : 'Test API'}
      </button>
      {apiInfo && (
        <div className="text-xs bg-gray-100 p-2 rounded max-h-40 overflow-auto">
          <pre>{JSON.stringify(apiInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default DebugInfo;
