import React, { useState, useEffect } from 'react';
import type { ProductionTask, TaskStatus, ProductionStage, UpdateTaskData } from '../../types/production.types';
import { productionService } from '../../services/production.service';
import { useAuth } from '../auth/useAuth';

interface TaskCardProps {
  task: ProductionTask;
  onUpdate: (taskId: string, data: UpdateTaskData) => void;
  isAssignedToMe: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, isAssignedToMe }) => {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(task.notes || '');
  const [actualHours, setActualHours] = useState(task.actual_hours?.toString() || '');

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'skipped': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'welding': return '⚡';
      case 'cutting': return '✂️';
      case 'drilling': return '🔩';
      case 'painting': return '🎨';
      case 'inspection': return '🔍';
      case 'assembly': return '🔧';
      case 'fabrication': return '🏭';
      case 'shipping': return '📦';
      default: return '📋';
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    const updateData: UpdateTaskData = {
      status: newStatus,
      notes,
      actual_hours: actualHours ? parseFloat(actualHours) : undefined,
    };

    if (newStatus === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    onUpdate(task.id, updateData);
    setEditing(false);
  };

  const getTimeDiff = () => {
    if (!task.started_at) return null;
    
    const started = new Date(task.started_at);
    const now = new Date();
    const diffHours = Math.abs(now.getTime() - started.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return `${Math.round(diffHours * 60)} mins`;
    if (diffHours < 24) return `${Math.round(diffHours)} hrs`;
    return `${Math.round(diffHours / 24)} days`;
  };

  return (
    <div className={`border rounded-lg p-4 ${isAssignedToMe ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTaskTypeIcon(task.task_type)}</span>
          <div>
            <h4 className="font-semibold text-gray-900">{task.task_name}</h4>
            <p className="text-sm text-gray-600">{task.stage?.name}</p>
          </div>
        </div>
        
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        {task.assigned_user && (
          <div className="flex justify-between">
            <span className="text-gray-600">Assigned:</span>
            <span className="font-medium">{task.assigned_user.full_name}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600">Estimated:</span>
          <span className="font-medium">{task.estimated_hours || '-'} hrs</span>
        </div>

        {task.status === 'in_progress' && (
          <div className="flex justify-between">
            <span className="text-gray-600">Time Elapsed:</span>
            <span className="font-medium text-blue-600">{getTimeDiff()}</span>
          </div>
        )}

        {task.status === 'completed' && task.actual_hours && (
          <div className="flex justify-between">
            <span className="text-gray-600">Actual:</span>
            <span className={`font-medium ${
              task.actual_hours > (task.estimated_hours || 0) ? 'text-red-600' : 'text-green-600'
            }`}>
              {task.actual_hours} hrs
            </span>
          </div>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Hours
            </label>
            <input
              type="number"
              value={actualHours}
              onChange={(e) => setActualHours(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.5"
              min="0"
              placeholder="0.0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Add any notes..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleStatusChange('completed')}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Complete
            </button>
            <button
              onClick={() => handleStatusChange('failed')}
              className="flex-1 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Failed
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex gap-2">
          {task.status === 'pending' && (
            <button
              onClick={() => handleStatusChange('in_progress')}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Start Task
            </button>
          )}
          
          {task.status === 'in_progress' && (
            <button
              onClick={() => setEditing(true)}
              className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Update Progress
            </button>
          )}

          {(task.status === 'pending' || task.status === 'in_progress') && (
            <button
              onClick={() => handleStatusChange('skipped')}
              className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
            >
              Skip
            </button>
          )}
        </div>
      )}

      {task.notes && !editing && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
          {task.notes}
        </div>
      )}
    </div>
  );
};

interface ProductionTaskListProps {
  workflowId: string;
  onTaskUpdate?: (task: ProductionTask) => void;
}

export const ProductionTaskList: React.FC<ProductionTaskListProps> = ({ 
  workflowId, 
  onTaskUpdate 
}) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ProductionTask[]>([]);
  const [stages, setStages] = useState<ProductionStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my_tasks' | 'pending' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const [tasksData, stagesData] = await Promise.all([
        productionService.getWorkflowTasks(workflowId),
        productionService.getProductionStages(),
      ]);
      setTasks(tasksData);
      setStages(stagesData);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, data: UpdateTaskData) => {
    try {
      const updatedTask = await productionService.updateTask(taskId, data);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      onTaskUpdate?.(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getFilteredTasks = () => {
    switch (filter) {
      case 'my_tasks':
        return tasks.filter(t => t.assigned_to === user?.id);
      case 'pending':
        return tasks.filter(t => t.status === 'pending');
      case 'in_progress':
        return tasks.filter(t => t.status === 'in_progress');
      case 'completed':
        return tasks.filter(t => t.status === 'completed');
      default:
        return tasks;
    }
  };

  const groupTasksByStage = () => {
    const grouped: Record<string, ProductionTask[]> = {};
    const filteredTasks = getFilteredTasks();
    
    filteredTasks.forEach(task => {
      const stageId = task.stage_id;
      if (!grouped[stageId]) {
        grouped[stageId] = [];
      }
      grouped[stageId].push(task);
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const groupedTasks = groupTasksByStage();
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };
  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Tasks</h3>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-xl font-bold text-blue-600">{stats.in_progress}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Completion</p>
            <p className="text-xl font-bold text-indigo-600">{Math.round(completionRate)}%</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {(['all', 'my_tasks', 'pending', 'in_progress', 'completed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.replace('_', ' ').charAt(0).toUpperCase() + f.slice(1).replace('_', ' ')}
              {f === 'my_tasks' && ` (${tasks.filter(t => t.assigned_to === user?.id).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks by Stage */}
      <div className="space-y-6">
        {stages
          .filter(stage => groupedTasks[stage.id]?.length > 0)
          .map(stage => (
            <div key={stage.id} className="border-l-4 border-indigo-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                {stage.name} ({groupedTasks[stage.id]?.length || 0} tasks)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedTasks[stage.id]?.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onUpdate={handleTaskUpdate}
                    isAssignedToMe={task.assigned_to === user?.id}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>

      {getFilteredTasks().length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks found for the selected filter
        </div>
      )}
    </div>
  );
};