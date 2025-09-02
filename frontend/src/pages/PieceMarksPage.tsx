import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../components/auth/useAuth';
import { PieceMarkList } from '../components/piecemarks/PieceMarkList';
import { PieceMarkForm } from '../components/piecemarks/PieceMarkForm';
import { pieceMarkService } from '../services/pieceMarkService';
import type { PieceMark, PieceMarkStatus, Project } from '../types/database.types';
import { supabase } from '../lib/supabase';
import { AppLayout } from '../components/layout/AppLayout';

export const PieceMarksPage: React.FC = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const { profile } = useAuth();
  const [pieceMarks, setPieceMarks] = useState<PieceMark[]>([]);
  const [filteredMarks, setFilteredMarks] = useState<PieceMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMark, setEditingMark] = useState<PieceMark | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PieceMarkStatus | 'all'>('all');
  const [project, setProject] = useState<Project | null>(null);

  const canEdit = ['admin', 'project_manager', 'shop'].includes(profile?.role || '');

  useEffect(() => {
    if (projectId) {
      fetchProject();
      fetchPieceMarks();
    }
  }, [projectId, fetchProject, fetchPieceMarks]);

  useEffect(() => {
    filterMarks();
  }, [filterMarks]);

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
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching project';
      console.error('Error fetching project:', errorMessage);
    }
  };

  const fetchPieceMarks = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const data = await pieceMarkService.getByProject(projectId);
      setPieceMarks(data || []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch piece marks';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterMarks = () => {
    let filtered = [...pieceMarks];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(mark =>
        mark.mark.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mark.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mark.material_type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(mark => mark.status === statusFilter);
    }

    setFilteredMarks(filtered);
  };

  const handleCreate = async (data: Partial<PieceMark>) => {
    try {
      await pieceMarkService.create(data as Omit<PieceMark, 'id' | 'created_at' | 'updated_at' | 'total_weight'>);
      setShowForm(false);
      fetchPieceMarks();
    } catch (error) {
      console.error('Failed to create piece mark:', error);
      throw error;
    }
  };

  const handleUpdate = async (data: Partial<PieceMark>) => {
    if (!editingMark) return;
    
    try {
      await pieceMarkService.update(editingMark.id, data);
      setEditingMark(null);
      setShowForm(false);
      fetchPieceMarks();
    } catch (error) {
      console.error('Failed to update piece mark:', error);
      throw error;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this piece mark?')) return;
    
    try {
      await pieceMarkService.delete(id);
      fetchPieceMarks();
    } catch (error) {
      console.error('Failed to delete piece mark:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: PieceMarkStatus) => {
    try {
      await pieceMarkService.updateStatus(id, status);
      fetchPieceMarks();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleEdit = (pieceMark: PieceMark) => {
    setEditingMark(pieceMark);
    setShowForm(true);
  };

  const getStats = () => {
    const stats = {
      total: filteredMarks.length,
      totalPieces: 0,
      totalWeight: 0,
      byStatus: {} as Record<PieceMarkStatus, number>,
    };

    filteredMarks.forEach(mark => {
      stats.totalPieces += mark.quantity;
      stats.totalWeight += mark.total_weight || 0;
      stats.byStatus[mark.status] = (stats.byStatus[mark.status] || 0) + mark.quantity;
    });

    return stats;
  };

  const stats = getStats();

  return (
    <AppLayout title={`Piece Marks${project?.name ? ' · ' + project.name : ''}`}>
      <main className="py-6">
        <div className="px-4 py-6 sm:px-0">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Marks</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Pieces</div>
              <div className="text-2xl font-bold">{stats.totalPieces}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Total Weight</div>
              <div className="text-2xl font-bold">{stats.totalWeight.toFixed(0)} lbs</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus.completed || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm text-gray-600">In Progress</div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.byStatus.fabricating || 0}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by mark, description, or material..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PieceMarkStatus | 'all')}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="fabricating">Fabricating</option>
                <option value="completed">Completed</option>
                <option value="shipped">Shipped</option>
                <option value="installed">Installed</option>
              </select>
            </div>
          </div>

          {/* Form Modal */}
          {showForm && projectId && (
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">
                  {editingMark ? 'Edit Piece Mark' : 'Create New Piece Mark'}
                </h2>
                <PieceMarkForm
                  projectId={projectId}
                  initialData={editingMark || undefined}
                  onSubmit={editingMark ? handleUpdate : handleCreate}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingMark(null);
                  }}
                />
              </div>
            </div>
          )}

          {/* Piece Marks List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : filteredMarks.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No piece marks found matching your filters.' 
                  : 'No piece marks found. Create your first piece mark to get started.'}
              </p>
            </div>
          ) : (
            <PieceMarkList
              pieceMarks={filteredMarks}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusUpdate={handleStatusUpdate}
              onRefresh={fetchPieceMarks}
              canEdit={canEdit}
            />
          )}
        </div>
      </main>
    </AppLayout>
  );
};
