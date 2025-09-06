import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Add debugging
console.log('main.tsx loading...');

// Add global error handler
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

window.addEventListener('error', event => {
  console.error('Global error:', event.error);
});

// Wait for DOM to be ready
const initApp = () => {
  console.log('Initializing app...');
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found');
    document.body.innerHTML = '<div style="padding: 20px; text-align: center;">Failed to load application - root element not found</div>';
    return;
  }
  
  console.log('Root element found, mounting React...');
  
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
    console.log('React app mounted successfully');
  } catch (error) {
    console.error('Failed to mount React app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: sans-serif;">
        <h1>Application Error</h1>
        <p>Failed to load the application. Check browser console for details.</p>
        <p style="color: red;">${error}</p>
        <p><a href="/test.html">Go to test page</a></p>
      </div>
    `;
  }
};

// Ensure DOM is loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
