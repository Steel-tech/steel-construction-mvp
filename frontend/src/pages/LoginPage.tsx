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

      {/* Demo Credentials */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</p>
          <div className="text-xs text-blue-700 space-y-1">
            <p>Email: demo@example.com</p>
            <p>Password: demo123</p>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Or <Link to="/signup" className="underline font-medium">create a new account</Link>
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