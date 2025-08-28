import React, { useState, useEffect } from 'react';
import { ProductionKanban } from './ProductionKanban';
import { ProductionTimeline } from './ProductionTimeline';
import { ProductionTaskList } from './ProductionTaskList';
import { ProductionWorkflow, ProductionStats, WorkflowUpdateEvent, TaskUpdateEvent } from '../../types/production.types';
import { productionService } from '../../services/production.service';
import { useAuth } from '../auth/AuthContext';

interface ProductionDashboardProps {
  projectId: string;
  pieceMarkId?: string;
}

export const ProductionDashboard: React.FC<ProductionDashboardProps> = ({ 
  projectId, 
  pieceMarkId 
}) => {
  const { user } = useAuth();
  const [view, setView] = useState<'kanban' | 'timeline' | 'tasks' | 'metrics'>('kanban');
  const [workflows, setWorkflows] = useState<ProductionWorkflow[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ProductionWorkflow | null>(null);
  const [stats, setStats] = useState<ProductionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [realtimeEvents, setRealtimeEvents] = useState<(WorkflowUpdateEvent | TaskUpdateEvent)[]>([]);

  useEffect(() => {
    fetchData();
    
    // Subscribe to real-time updates
    const unsubscribeWorkflow = productionService.subscribeToWorkflowUpdates(
      projectId,
      handleWorkflowUpdate
    );

    return () => {
      unsubscribeWorkflow();
    };
  }, [projectId]);

  useEffect(() => {
    if (selectedWorkflow) {
      // Subscribe to task updates for selected workflow
      const unsubscribeTask = productionService.subscribeToTaskUpdates(
        selectedWorkflow.id,
        handleTaskUpdate
      );

      return () => {
        unsubscribeTask();
      };
    }
  }, [selectedWorkflow?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [workflowsData, statsData] = await Promise.all([
        productionService.getProjectWorkflows(projectId),
        productionService.getProductionStats(projectId),
      ]);
      
      setWorkflows(workflowsData);
      setStats(statsData);
      
      // Auto-select workflow if pieceMarkId provided
      if (pieceMarkId) {
        const workflow = workflowsData.find(w => w.piece_mark_id === pieceMarkId);
        if (workflow) setSelectedWorkflow(workflow);
      } else if (workflowsData.length > 0 && !selectedWorkflow) {
        setSelectedWorkflow(workflowsData[0]);
      }
    } catch (error) {
      console.error('Error fetching production data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowUpdate = (event: WorkflowUpdateEvent) => {
    console.log('Workflow update:', event);
    setRealtimeEvents(prev => [event, ...prev].slice(0, 10));
    
    // Update local state
    if (event.type === 'UPDATE') {
      setWorkflows(prev => prev.map(w => 
        w.id === event.workflow_id 
          ? { ...w, ...event.changes }
          : w
      ));
      
      if (selectedWorkflow?.id === event.workflow_id) {
        setSelectedWorkflow(prev => prev ? { ...prev, ...event.changes } : null);
      }
    } else if (event.type === 'INSERT') {
      fetchData(); // Refetch to get complete data
    }
  };

  const handleTaskUpdate = (event: TaskUpdateEvent) => {
    console.log('Task update:', event);
    setRealtimeEvents(prev => [event, ...prev].slice(0, 10));
    
    // Trigger refresh of task list component
    if (view === 'tasks') {
      // The TaskList component will handle its own updates
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'on_hold': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'normal': return '🟡';
      case 'low': return '⚪';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Production Dashboard</h2>
            <p className="text-gray-600">Real-time production tracking and management</p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            + New Workflow
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold">{stats.total_pieces}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{stats.in_progress}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">On Hold</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.on_hold}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Completion</p>
              <p className="text-2xl font-bold text-purple-600">
                {Math.round(stats.completion_rate)}%
              </p>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Avg Cycle</p>
              <p className="text-2xl font-bold text-indigo-600">
                {Math.round(stats.average_cycle_time)}h
              </p>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Efficiency</p>
              <p className="text-2xl font-bold text-orange-600">
                {Math.round(stats.efficiency_rate)}%
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Open Issues</p>
              <p className="text-2xl font-bold text-red-600">{stats.issues_open}</p>
            </div>
          </div>
        )}
      </div>

      {/* View Selector and Workflow Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* View Tabs */}
          <div className="flex gap-2">
            {(['kanban', 'timeline', 'tasks', 'metrics'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  view === v
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>

          {/* Workflow Selector (for timeline and tasks views) */}
          {(view === 'timeline' || view === 'tasks') && workflows.length > 0 && (
            <div className="flex-1">
              <select
                value={selectedWorkflow?.id || ''}
                onChange={(e) => {
                  const workflow = workflows.find(w => w.id === e.target.value);
                  setSelectedWorkflow(workflow || null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a piece mark...</option>
                {workflows.map(w => (
                  <option key={w.id} value={w.id}>
                    {getPriorityIcon(w.priority)} {w.piece_mark?.mark} - {w.piece_mark?.description}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {view === 'kanban' && (
          <ProductionKanban 
            projectId={projectId}
            onWorkflowUpdate={(workflow) => {
              setSelectedWorkflow(workflow);
              fetchData();
            }}
          />
        )}

        {view === 'timeline' && selectedWorkflow && (
          <ProductionTimeline
            workflow={selectedWorkflow}
            onStageComplete={() => fetchData()}
          />
        )}

        {view === 'tasks' && selectedWorkflow && (
          <ProductionTaskList
            workflowId={selectedWorkflow.id}
            onTaskUpdate={() => fetchData()}
          />
        )}

        {view === 'metrics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Production Metrics</h3>
            
            {/* Workflow Performance Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Piece Mark
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workflows.map(workflow => (
                    <tr key={workflow.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {workflow.piece_mark?.mark}
                          </div>
                          <div className="text-sm text-gray-500">
                            {workflow.piece_mark?.description}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(workflow.status)}`}>
                          {workflow.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getPriorityIcon(workflow.priority)} {workflow.priority}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${workflow.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{workflow.progress_percentage}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workflow.assigned_user?.full_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setSelectedWorkflow(workflow);
                            setView('timeline');
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Events Feed */}
      {realtimeEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Real-time Updates</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {realtimeEvents.map((event, index) => (
              <div key={index} className="text-xs text-gray-600 flex items-center gap-2">
                <span className="text-green-500">●</span>
                <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                <span className="font-medium">
                  {'workflow_id' in event ? 'Workflow' : 'Task'} {event.type.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};