import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { ConnectionStatus } from '../components/ConnectionStatus';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-4xl font-extrabold text-gray-900 mb-2">
          Steel Construction
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          Project Management System
        </p>
      </div>

      {/* Connection Status */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4">
        <ConnectionStatus />
      </div>

      <LoginForm onSuccess={handleSuccess} />

      {/* Demo Access */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-4">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 shadow-lg">
          <p className="text-white font-bold text-center mb-3">🚀 Quick Demo Access</p>
          <a 
            href="/?demo=true" 
            className="block w-full text-center bg-white text-blue-600 font-bold py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Enter Demo Mode
          </a>
          <p className="text-white text-xs text-center mt-2">
            No login required - See the full dashboard instantly
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <span className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            Sign up
          </Link>
        </span>
      </div>
    </div>
  );
};