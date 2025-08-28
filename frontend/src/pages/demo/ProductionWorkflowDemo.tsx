import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductionDashboard } from '../../components/production/ProductionDashboard';

export const ProductionWorkflowDemo: React.FC = () => {
  const navigate = useNavigate();
  const [showDashboard, setShowDashboard] = useState(false);
  
  // Demo project ID (would come from actual project in production)
  const demoProjectId = 'demo-project-123';
  
  const features = [
    {
      icon: '📊',
      title: 'Kanban Board',
      description: 'Drag & drop piece marks through production stages',
      color: 'blue',
    },
    {
      icon: '📈',
      title: 'Timeline View',
      description: 'Track progress through each production stage',
      color: 'green',
    },
    {
      icon: '✅',
      title: 'Task Management',
      description: 'Assign and track individual production tasks',
      color: 'purple',
    },
    {
      icon: '🔄',
      title: 'Real-time Updates',
      description: 'Live synchronization across all users',
      color: 'orange',
    },
    {
      icon: '📉',
      title: 'Production Metrics',
      description: 'Monitor efficiency and cycle times',
      color: 'red',
    },
    {
      icon: '🔔',
      title: 'Issue Tracking',
      description: 'Report and resolve production issues',
      color: 'yellow',
    },
  ];

  const workflowStages = [
    'Engineering Review',
    'Material Preparation',
    'Cutting',
    'Drilling & Punching',
    'Fitting',
    'Welding',
    'Quality Inspection',
    'Surface Preparation',
    'Painting/Galvanizing',
    'Final QC',
    'Shipping Preparation',
    'Ready for Shipment',
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Production Workflow Demo</h1>
              <p className="text-gray-600">Complete piece mark production tracking system</p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showDashboard ? (
          <>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-8 text-white mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Steel Production Workflow System</h2>
                  <p className="text-lg text-indigo-100 mb-6">
                    Track every piece mark from engineering review through shipment with real-time updates
                  </p>
                  <button
                    onClick={() => setShowDashboard(true)}
                    className="px-6 py-3 bg-white text-indigo-600 rounded-md font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Launch Production Dashboard
                  </button>
                </div>
                <div className="hidden lg:block">
                  <div className="text-6xl">🏭</div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {features.map((feature) => (
                <div key={feature.title} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start">
                    <div className="text-3xl mr-4">{feature.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Workflow Stages */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Production Stages</h3>
              <div className="space-y-2">
                {workflowStages.map((stage, index) => (
                  <div key={stage} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm ${
                      index < 3 ? 'bg-purple-500' :
                      index < 6 ? 'bg-blue-500' :
                      index < 9 ? 'bg-green-500' :
                      'bg-yellow-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-900">{stage}</div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      index < 2 ? 'bg-purple-100 text-purple-800' :
                      index < 7 ? 'bg-blue-100 text-blue-800' :
                      index < 9 ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {index < 2 ? 'Engineering' :
                       index < 7 ? 'Shop' :
                       index < 9 ? 'Paint' :
                       'Shipping'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">📝 Demo Instructions</h3>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Click "Launch Production Dashboard" to open the production tracking system</li>
                <li>• Use the Kanban view to drag piece marks between production stages</li>
                <li>• Switch to Timeline view to see detailed stage progression</li>
                <li>• Use Tasks view to manage individual production tasks</li>
                <li>• Watch for real-time updates in the activity feed</li>
                <li>• All changes are synchronized across users in real-time via Supabase</li>
              </ul>
            </div>

            {/* Key Benefits */}
            <div className="mt-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">🎯 Key Benefits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Complete visibility of production status</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Real-time synchronization across teams</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Identify bottlenecks quickly</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Track cycle times and efficiency</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Assign tasks to specific workers</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span className="text-gray-700">Document issues and resolutions</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Back Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowDashboard(false)}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Overview
              </button>
            </div>

            {/* Production Dashboard */}
            <ProductionDashboard projectId={demoProjectId} />
          </>
        )}
      </div>
    </div>
  );
};