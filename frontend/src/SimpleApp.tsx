import React from 'react';

export const SimpleApp: React.FC = () => {
  const [backendStatus, setBackendStatus] = React.useState<string>('Checking...');
  const [backendError, setBackendError] = React.useState<string>('');

  React.useEffect(() => {
    // Check backend connection with better error handling
    const checkBackend = async () => {
      try {
        const response = await fetch('https://steel-construction-api.onrender.com/health', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          mode: 'cors',
        });
        
        if (response.ok) {
          const data = await response.json();
          setBackendStatus(`✅ Connected - ${data.status || 'healthy'}`);
        } else {
          setBackendStatus('⚠️ Backend responded with error');
          setBackendError(`Status: ${response.status}`);
        }
      } catch (err) {
        setBackendStatus('🔄 Backend is waking up...');
        setBackendError('Free tier servers sleep after 15 min of inactivity. First request takes 30-60 seconds to wake up. Please wait...');
        
        // Retry after 5 seconds
        setTimeout(() => {
          checkBackend();
        }, 5000);
      }
    };
    
    checkBackend();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏗️ Steel Construction MVP</h1>
          <p className="text-gray-600">Project Management System</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">System Status</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-gray-700">Frontend: React is working!</span>
            </div>
            <div className="flex items-center">
              <span className="mr-2">{backendStatus.includes('✅') ? '✅' : backendStatus.includes('🔄') ? '🔄' : '⚠️'}</span>
              <span className="text-gray-700">Backend: {backendStatus}</span>
            </div>
            {backendError && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">{backendError}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-4">🔗 Quick Links</h2>
            <div className="space-y-2">
              <a href="/login" className="block text-blue-600 hover:text-blue-800 hover:underline">
                → Go to Login Page
              </a>
              <a href="/signup" className="block text-blue-600 hover:text-blue-800 hover:underline">
                → Create Account
              </a>
              <a href="/test.html" className="block text-blue-600 hover:text-blue-800 hover:underline">
                → Static Test Page
              </a>
            </div>
          </div>

          <div className="bg-amber-50 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-amber-900 mb-4">🔑 Demo Credentials</h2>
            <div className="space-y-1">
              <p className="text-gray-700">
                <span className="font-medium">Email:</span> demo@example.com
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Password:</span> demo123
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Note: Create this account via signup first
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-green-50 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-green-900 mb-4">ℹ️ Deployment Info</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Frontend (Vercel):</p>
              <p className="text-gray-600">React + TypeScript + Vite</p>
              <p className="text-xs text-gray-500">Always active, fast CDN</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Backend (Render):</p>
              <p className="text-gray-600">Node.js + Express + PostgreSQL</p>
              <p className="text-xs text-gray-500">Free tier: Sleeps after 15 min</p>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>React is working! Current time: {new Date().toLocaleTimeString()}</p>
          <p className="mt-2">🚀 Deployed with Vercel + Render</p>
        </div>
      </div>
    </div>
  );
};