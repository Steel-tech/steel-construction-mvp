import React from 'react';
import { useAuth } from '../auth/useAuth';

interface TopNavProps {
  title?: string;
}

const roleBadge = (role?: string) => {
  switch (role) {
    case 'admin': return 'bg-red-100 text-red-800';
    case 'project_manager': return 'bg-purple-100 text-purple-800';
    case 'shop': return 'bg-blue-100 text-blue-800';
    case 'field': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const TopNav: React.FC<TopNavProps> = ({ title }) => {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden lg:block text-xl font-semibold truncate">{title || 'Steel Construction'}</div>
          <div className="lg:hidden text-lg font-semibold truncate">{title || 'Steel Construction'}</div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 max-w-[50vw]">
              <span className="text-gray-700 truncate">{user.full_name}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                {user.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          )}
          {user && (
            <button
              onClick={() => signOut()}
              disabled={loading}
              className="inline-flex items-center rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-600 disabled:opacity-50"
              aria-label="Sign out"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopNav;

