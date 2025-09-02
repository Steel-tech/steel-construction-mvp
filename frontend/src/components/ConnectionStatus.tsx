import React, { useEffect, useState } from 'react';

export const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendUrl, setBackendUrl] = useState<string>('');

  useEffect(() => {
    const checkConnection = async () => {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://steel-construction-api.onrender.com/api/v1';
      setBackendUrl(apiUrl.replace('/api/v1', ''));
      
      try {
        const healthUrl = apiUrl.replace('/api/v1', '/health');
        const response = await fetch(healthUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
        });
        
        if (response.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch (error) {
        console.error('Backend connection check failed:', error);
        setStatus('offline');
      }
    };

    checkConnection();
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (status === 'checking') {
    return (
      <div className="text-center p-3 bg-gray-100 rounded-lg">
        <span className="text-gray-600 text-sm">Checking backend connection...</span>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm font-medium">⚠️ Backend Server is Starting</p>
        <p className="text-yellow-600 text-xs mt-1">
          The free tier server may take 30-60 seconds to wake up on first visit
        </p>
        <p className="text-yellow-600 text-xs mt-1">
          Backend: {backendUrl}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
      <p className="text-green-800 text-sm font-medium">✅ Backend Connected</p>
      <p className="text-green-600 text-xs mt-1">{backendUrl}</p>
    </div>
  );
};