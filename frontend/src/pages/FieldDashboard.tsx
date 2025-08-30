import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/auth/useAuth';
import { DeliveryReceiving } from '../components/field/DeliveryReceiving';
import { PieceLocationTracker } from '../components/field/PieceLocationTracker';
import { CrewAssignmentComponent } from '../components/field/CrewAssignment';
import { supabase } from '../lib/supabase';
import type { Project } from '../types/database.types';

type TabType = 'overview' | 'deliveries' | 'locations' | 'crews';

export const FieldDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState({
    totalPieces: 0,
    receivedPieces: 0,
    installedPieces: 0,
    activeCrews: 0,
    todayDeliveries: 0,
  });

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchStats();
    }
  }, [projectId, fetchProject, fetchStats]);

  const fetchProject = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    }
  };

  const fetchStats = async () => {
    if (!projectId) return;

    try {
      // Fetch piece marks stats
      const { data: pieces, error: piecesError } = await supabase
        .from('piece_marks')
        .select('status, quantity')
        .eq('project_id', projectId);

      if (piecesError) throw piecesError;

      let totalPieces = 0;
      let receivedPieces = 0;
      let installedPieces = 0;

      pieces?.forEach(piece => {
        totalPieces += piece.quantity;
        if (piece.status === 'shipped') receivedPieces += piece.quantity;
        if (piece.status === 'installed') installedPieces += piece.quantity;
      });

      // Fetch active crews
      const today = new Date().toISOString().split('T')[0];
      const { data: crews, error: crewsError } = await supabase
        .from('crew_assignments')
        .select('id')
        .eq('project_id', projectId)
        .eq('date', today)
        .eq('status', 'active');

      if (crewsError) throw crewsError;

      // Fetch today's deliveries
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('id')
        .eq('project_id', projectId)
        .eq('scheduled_date', today);

      if (deliveriesError) throw deliveriesError;

      setStats({
        totalPieces,
        receivedPieces,
        installedPieces,
        activeCrews: crews?.length || 0,
        todayDeliveries: deliveries?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'deliveries', label: 'Deliveries', icon: '🚚' },
    { id: 'locations', label: 'Locations', icon: '📍' },
    { id: 'crews', label: 'Crews', icon: '👷' },
  ];

  const canManageField = ['admin', 'project_manager', 'field'].includes(profile?.role || '');

  if (!canManageField) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access field operations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile-Optimized Header */}
      <nav className="bg-white shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 overflow-x-auto">
              <button
                onClick={() => navigate('/projects')}
                className="text-gray-600 hover:text-gray-900 whitespace-nowrap"
              >
                ← Back
              </button>
              <h1 className="text-lg sm:text-xl font-semibold truncate">
                Field Ops - {project?.name || 'Loading...'}
              </h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile-Optimized Tab Navigation */}
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick Stats Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Total Pieces</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.totalPieces}</p>
                  </div>
                  <span className="text-2xl">📦</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Received</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {stats.receivedPieces}
                    </p>
                  </div>
                  <span className="text-2xl">📥</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Installed</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {stats.installedPieces}
                    </p>
                  </div>
                  <span className="text-2xl">✅</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Active Crews</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.activeCrews}</p>
                  </div>
                  <span className="text-2xl">👷</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Today's Deliveries</p>
                    <p className="text-xl sm:text-2xl font-bold">{stats.todayDeliveries}</p>
                  </div>
                  <span className="text-2xl">🚚</span>
                </div>
              </div>
            </div>

            {/* Progress Overview - Mobile Optimized */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">Installation Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Overall Progress</span>
                    <span>{Math.round((stats.installedPieces / stats.totalPieces) * 100) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all"
                      style={{ 
                        width: `${Math.round((stats.installedPieces / stats.totalPieces) * 100) || 0}%` 
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pieces on Site</span>
                    <span>{Math.round((stats.receivedPieces / stats.totalPieces) * 100) || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{ 
                        width: `${Math.round((stats.receivedPieces / stats.totalPieces) * 100) || 0}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions - Mobile Optimized */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-bold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => setActiveTab('deliveries')}
                  className="p-3 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition-colors"
                >
                  <span className="text-2xl block mb-1">📥</span>
                  <span className="text-xs sm:text-sm">Receive Delivery</span>
                </button>
                <button
                  onClick={() => setActiveTab('locations')}
                  className="p-3 bg-green-50 rounded-lg text-center hover:bg-green-100 transition-colors"
                >
                  <span className="text-2xl block mb-1">📍</span>
                  <span className="text-xs sm:text-sm">Update Location</span>
                </button>
                <button
                  onClick={() => setActiveTab('crews')}
                  className="p-3 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 transition-colors"
                >
                  <span className="text-2xl block mb-1">👷</span>
                  <span className="text-xs sm:text-sm">Assign Crew</span>
                </button>
                <button
                  className="p-3 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition-colors"
                >
                  <span className="text-2xl block mb-1">📸</span>
                  <span className="text-xs sm:text-sm">Add Photo</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deliveries' && projectId && (
          <DeliveryReceiving 
            projectId={projectId} 
            onDeliveryReceived={fetchStats}
          />
        )}

        {activeTab === 'locations' && projectId && (
          <PieceLocationTracker projectId={projectId} />
        )}

        {activeTab === 'crews' && projectId && (
          <CrewAssignmentComponent projectId={projectId} />
        )}
      </main>
    </div>
  );
};