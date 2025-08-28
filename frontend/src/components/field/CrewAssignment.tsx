import React, { useState, useEffect } from 'react';
import type { CrewAssignment } from '../../types/field.types';
import type { Profile, PieceMark } from '../../types/database.types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface CrewAssignmentProps {
  projectId: string;
}

export const CrewAssignmentComponent: React.FC<CrewAssignmentProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [crews, setCrews] = useState<CrewAssignment[]>([]);
  const [foremen, setForemen] = useState<Profile[]>([]);
  const [availablePieces, setAvailablePieces] = useState<PieceMark[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showForm, setShowForm] = useState(false);
  const [editingCrew, setEditingCrew] = useState<CrewAssignment | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    crew_name: '',
    foreman_id: '',
    crew_size: 1,
    zone: '',
    shift: 'day' as 'day' | 'night' | 'weekend',
    piece_marks: [] as string[],
  });

  useEffect(() => {
    fetchCrews();
    fetchForemen();
    fetchAvailablePieces();
  }, [projectId, selectedDate]);

  const fetchCrews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('crew_assignments')
        .select('*')
        .eq('project_id', projectId)
        .eq('date', selectedDate)
        .order('shift');

      if (error) throw error;
      setCrews(data || []);
    } catch (error) {
      console.error('Error fetching crews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForemen = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['field', 'project_manager'])
        .order('full_name');

      if (error) throw error;
      setForemen(data || []);
    } catch (error) {
      console.error('Error fetching foremen:', error);
    }
  };

  const fetchAvailablePieces = async () => {
    try {
      const { data, error } = await supabase
        .from('piece_marks')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'shipped')
        .order('sequence_number');

      if (error) throw error;
      setAvailablePieces(data || []);
    } catch (error) {
      console.error('Error fetching piece marks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const assignmentData = {
        project_id: projectId,
        ...formData,
        date: selectedDate,
        status: 'scheduled' as const,
      };

      if (editingCrew) {
        const { error } = await supabase
          .from('crew_assignments')
          .update(assignmentData)
          .eq('id', editingCrew.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('crew_assignments')
          .insert(assignmentData);

        if (error) throw error;
      }

      // Update assigned piece marks
      if (formData.piece_marks.length > 0) {
        const { error: updateError } = await supabase
          .from('piece_marks')
          .update({ field_assigned_to: formData.foreman_id })
          .in('id', formData.piece_marks);

        if (updateError) throw updateError;
      }

      setShowForm(false);
      setEditingCrew(null);
      resetForm();
      fetchCrews();
    } catch (error) {
      console.error('Error saving crew assignment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (crew: CrewAssignment) => {
    setEditingCrew(crew);
    setFormData({
      crew_name: crew.crew_name,
      foreman_id: crew.foreman_id,
      crew_size: crew.crew_size,
      zone: crew.zone || '',
      shift: crew.shift,
      piece_marks: crew.piece_marks || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this crew assignment?')) return;

    try {
      const { error } = await supabase
        .from('crew_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchCrews();
    } catch (error) {
      console.error('Error deleting crew:', error);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'active' | 'completed') => {
    try {
      const { error } = await supabase
        .from('crew_assignments')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      fetchCrews();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      crew_name: '',
      foreman_id: '',
      crew_size: 1,
      zone: '',
      shift: 'day',
      piece_marks: [],
    });
  };

  const getShiftIcon = (shift: string) => {
    switch (shift) {
      case 'day': return '☀️';
      case 'night': return '🌙';
      case 'weekend': return '📅';
      default: return '⏰';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-bold">Crew Assignments</h2>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => {
                setEditingCrew(null);
                resetForm();
                setShowForm(true);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + New Assignment
            </button>
          </div>
        </div>

        {/* Shift Summary */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {['day', 'night', 'weekend'].map(shift => {
            const shiftCrews = crews.filter(c => c.shift === shift);
            const totalWorkers = shiftCrews.reduce((sum, c) => sum + c.crew_size, 0);
            
            return (
              <div key={shift} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <span className="text-xl">{getShiftIcon(shift)}</span>
                  <span className="font-medium capitalize">{shift}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {shiftCrews.length} crew{shiftCrews.length !== 1 ? 's' : ''} • {totalWorkers} workers
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Crew Assignment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold mb-4">
              {editingCrew ? 'Edit Crew Assignment' : 'New Crew Assignment'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crew Name
                  </label>
                  <input
                    type="text"
                    value={formData.crew_name}
                    onChange={(e) => setFormData({ ...formData, crew_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foreman
                  </label>
                  <select
                    value={formData.foreman_id}
                    onChange={(e) => setFormData({ ...formData, foreman_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Foreman</option>
                    {foremen.map(foreman => (
                      <option key={foreman.id} value={foreman.id}>
                        {foreman.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Crew Size
                  </label>
                  <input
                    type="number"
                    value={formData.crew_size}
                    onChange={(e) => setFormData({ ...formData, crew_size: parseInt(e.target.value) })}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shift
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="day">Day Shift</option>
                    <option value="night">Night Shift</option>
                    <option value="weekend">Weekend</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zone/Area
                  </label>
                  <input
                    type="text"
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    placeholder="e.g., North Wing, Level 3"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned Piece Marks
                </label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                  {availablePieces.length === 0 ? (
                    <p className="text-gray-500 text-sm">No pieces available for assignment</p>
                  ) : (
                    <div className="space-y-2">
                      {availablePieces.map(piece => (
                        <label key={piece.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            value={piece.id}
                            checked={formData.piece_marks.includes(piece.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  piece_marks: [...formData.piece_marks, piece.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  piece_marks: formData.piece_marks.filter(id => id !== piece.id),
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">
                            {piece.mark} - {piece.description} ({piece.quantity} pcs)
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCrew(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : editingCrew ? 'Update' : 'Create'} Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Crew Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {crews.map(crew => {
          const foreman = foremen.find(f => f.id === crew.foreman_id);
          
          return (
            <div key={crew.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{crew.crew_name}</h3>
                  <p className="text-sm text-gray-600">
                    Foreman: {foreman?.full_name || 'Unknown'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl">{getShiftIcon(crew.shift)}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(crew.status)}`}>
                    {crew.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                <div>
                  <span className="text-gray-600">Crew Size:</span>
                  <span className="ml-1 font-medium">{crew.crew_size} workers</span>
                </div>
                <div>
                  <span className="text-gray-600">Zone:</span>
                  <span className="ml-1 font-medium">{crew.zone || 'Not assigned'}</span>
                </div>
              </div>

              {crew.piece_marks && crew.piece_marks.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">Assigned Pieces:</p>
                  <div className="flex flex-wrap gap-1">
                    {crew.piece_marks.slice(0, 5).map((markId, index) => {
                      const piece = availablePieces.find(p => p.id === markId);
                      return piece ? (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-xs rounded">
                          {piece.mark}
                        </span>
                      ) : null;
                    })}
                    {crew.piece_marks.length > 5 && (
                      <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                        +{crew.piece_marks.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                {crew.status === 'scheduled' && (
                  <button
                    onClick={() => handleStatusUpdate(crew.id, 'active')}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                  >
                    Start Work
                  </button>
                )}
                {crew.status === 'active' && (
                  <button
                    onClick={() => handleStatusUpdate(crew.id, 'completed')}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={() => handleEdit(crew)}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(crew.id)}
                  className="px-3 py-1 bg-red-100 text-red-600 text-sm rounded hover:bg-red-200"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {crews.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No crew assignments for {selectedDate}</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Create First Assignment
          </button>
        </div>
      )}
    </div>
  );
};