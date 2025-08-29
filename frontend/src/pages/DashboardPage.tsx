import React from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'project_manager': return 'bg-purple-100 text-purple-800';
      case 'shop': return 'bg-blue-100 text-blue-800';
      case 'field': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const dashboardCards = [
    { title: 'Active Projects', count: '0', color: 'bg-blue-500', link: '/projects' },
    { title: 'Open Work Orders', count: '0', color: 'bg-yellow-500', link: '/work-orders' },
    { title: 'Completed Tasks', count: '0', color: 'bg-green-500', link: '#' },
    { title: 'Pending Reviews', count: '0', color: 'bg-purple-500', link: '#' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Steel Construction MVP</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-700">{profile?.full_name}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(profile?.role)}`}>
                  {profile?.role?.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {profile?.full_name}!
              </h2>
              <p className="text-gray-600">
                Here's an overview of your construction projects and tasks.
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Cards */}
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardCards.map((card) => (
              <div
                key={card.title}
                className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(card.link)}
              >
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`${card.color} rounded-md p-3`}>
                        <div className="h-6 w-6 text-white">
                          {/* Icon placeholder */}
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 001 1h3a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {card.title}
                        </dt>
                        <dd className="text-3xl font-semibold text-gray-900">
                          {card.count}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <button
                  onClick={() => navigate('/projects')}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  View Projects
                </button>
                {['admin', 'project_manager', 'shop', 'field'].includes(profile?.role || '') && (
                  <button
                    onClick={() => navigate('/work-orders')}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Manage Work Orders
                  </button>
                )}
                <button
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Generate Report
                </button>
                <button
                  onClick={() => navigate('/demo/piece-mark-card')}
                  className="inline-flex items-center justify-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100"
                >
                  🎮 Component Demo
                </button>
                {['admin', 'project_manager', 'shop'].includes(profile?.role || '') && (
                  <>
                    <button
                      onClick={() => navigate('/demo/quality-control')}
                      className="inline-flex items-center justify-center px-4 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                    >
                      ✅ Quality Control Demo
                    </button>
                    <button
                      onClick={() => navigate('/demo/production-workflow')}
                      className="inline-flex items-center justify-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                    >
                      🏭 Production Workflow Demo
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};