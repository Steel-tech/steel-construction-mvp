import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SignupForm } from '../components/auth/SignupForm';

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-4xl font-extrabold text-gray-900 mb-2">
          Steel Construction
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          Create your account
        </p>
      </div>

      <SignupForm onSuccess={handleSuccess} />

      <div className="mt-6 text-center">
        <span className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </span>
      </div>
    </div>
  );
};