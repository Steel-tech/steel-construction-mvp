import React from 'react';

export const SimpleApp: React.FC = () => {
  const [backendStatus, setBackendStatus] = React.useState<string>('Checking...');

  React.useEffect(() => {
    // Check backend connection
    fetch('https://steel-construction-api.onrender.com/health')
      .then(res => res.json())
      .then(data => {
        setBackendStatus(`✅ Connected - ${data.status}`);
      })
      .catch(err => {
        setBackendStatus(`⚠️ Backend offline - ${err.message}`);
      });
  }, []);

  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '600px',
      margin: '50px auto',
      padding: '20px'
    }}>
      <h1>Steel Construction MVP</h1>
      
      <div style={{ 
        background: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>System Status</h2>
        <p>Frontend: ✅ React is working!</p>
        <p>Backend: {backendStatus}</p>
      </div>

      <div style={{ 
        background: '#e3f2fd', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Quick Links</h2>
        <p><a href="/login">Go to Login Page</a></p>
        <p><a href="/signup">Create Account</a></p>
        <p><a href="/test.html">Static Test Page</a></p>
      </div>

      <div style={{ 
        background: '#fff3e0', 
        padding: '20px', 
        borderRadius: '8px'
      }}>
        <h2>Demo Credentials</h2>
        <p>Email: demo@example.com</p>
        <p>Password: demo123</p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Note: You need to create this account first via signup
        </p>
      </div>

      <hr style={{ margin: '40px 0' }} />
      
      <div style={{ textAlign: 'center', color: '#666' }}>
        <p>If you see this page, React is working correctly!</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};