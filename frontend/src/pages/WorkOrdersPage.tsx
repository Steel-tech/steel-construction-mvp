import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { supabase } from '../lib/supabase';
import type { WorkOrder } from '../types/database.types';

export const WorkOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'assigned'>('all');

  useEffect(() => {
    fetchWorkOrders();
  }, [filter]);

  const fetchWorkOrders = async () => {
    try {
      let query = supabase
        .from('work_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'assigned' && profile) {
        query = query.eq('assigned_to', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setWorkOrders(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fabrication': return '🔨';
      case 'installation': return '🏗️';
      case 'inspection': return '🔍';
      case 'repair': return '🔧';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold">Work Orders</h1>
            </div>
            
            {['admin', 'project_manager'].includes(profile?.role || '') && (
              <div className="flex items-center">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                  New Work Order
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilter('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Work Orders
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                filter === 'assigned'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Assigned to Me
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : workOrders.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">
                {filter === 'assigned' 
                  ? 'No work orders assigned to you.' 
                  : 'No work orders found. Create your first work order to get started.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {workOrders.map((workOrder) => (
                <div key={workOrder.id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">{getTypeIcon(workOrder.type)}</span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {workOrder.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          #{workOrder.work_order_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(workOrder.status)}`}>
                        {workOrder.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityBadgeColor(workOrder.priority)}`}>
                        {workOrder.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">
                    {workOrder.description || 'No description provided'}
                  </p>

                  <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-500">
                      Type: <span className="font-medium text-gray-700">{workOrder.type}</span>
                    </div>
                    {workOrder.due_date && (
                      <div className="text-gray-500">
                        Due: <span className="font-medium text-gray-700">
                          {new Date(workOrder.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {workOrder.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                      <strong>Notes:</strong> {workOrder.notes}
                    </div>
                  )}

                  {['shop', 'field'].includes(profile?.role || '') && workOrder.assigned_to === profile?.id && (
                    <div className="mt-4 flex justify-end space-x-2">
                      <button className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600">
                        Update Status
                      </button>
                      <button className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600">
                        Mark Complete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};