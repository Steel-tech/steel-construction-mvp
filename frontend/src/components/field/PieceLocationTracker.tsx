import React, { useState, useEffect, useCallback } from 'react';
import type { PieceMark } from '../../types/database.types';
import type { PieceLocation, FieldActivity } from '../../types/field.types';

// Extend PieceMark to include field_location
interface PieceMarkWithLocation extends PieceMark {
  field_location?: PieceLocation;
}
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/useAuth';

interface PieceLocationTrackerProps {
  projectId: string;
}

export const PieceLocationTracker: React.FC<PieceLocationTrackerProps> = ({ projectId }) => {
  const { user } = useAuth();
  const [pieceMarks, setPieceMarks] = useState<PieceMarkWithLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<PieceLocation | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [movingPiece, setMovingPiece] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState<PieceLocation>('yard');
  const [activities, setActivities] = useState<FieldActivity[]>([]);

  useEffect(() => {
    fetchPieceMarks();
    fetchRecentActivities();
  }, [fetchPieceMarks, fetchRecentActivities]);

  const fetchPieceMarks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('piece_marks')
        .select('*')
        .eq('project_id', projectId)
        .in('status', ['shipped', 'installed'])
        .order('sequence_number');

      if (error) throw error;
      setPieceMarks(data || []);
    } catch (error) {
      console.error('Error fetching piece marks:', error);
    }
  }, [projectId]);

  const fetchRecentActivities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('field_activities')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  }, [projectId]);

  const handleLocationUpdate = async (pieceMarkId: string, newLocation: PieceLocation) => {
    if (!user) return;

    try {
      // Update piece mark location (store in metadata or custom field)
      const { error: updateError } = await supabase
        .from('piece_marks')
        .update({ 
          field_location: newLocation,
          status: newLocation === 'installed' ? 'installed' : 'shipped'
        })
        .eq('id', pieceMarkId);

      if (updateError) throw updateError;

      // Log the activity
      const { error: activityError } = await supabase
        .from('field_activities')
        .insert({
          project_id: projectId,
          piece_mark_id: pieceMarkId,
          activity_type: 'moved',
          description: `Piece moved to ${newLocation}`,
          location: newLocation,
          user_id: user.id,
        });

      if (activityError) throw activityError;

      setMovingPiece(null);
      fetchPieceMarks();
      fetchRecentActivities();
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const getLocationIcon = (location: PieceLocation) => {
    switch (location) {
      case 'yard': return '🏭';
      case 'staging': return '📦';
      case 'crane_zone': return '🏗️';
      case 'installed': return '✅';
      case 'unknown': return '❓';
      default: return '📍';
    }
  };

  const getLocationColor = (location: PieceLocation) => {
    switch (location) {
      case 'yard': return 'bg-gray-100 text-gray-800';
      case 'staging': return 'bg-yellow-100 text-yellow-800';
      case 'crane_zone': return 'bg-orange-100 text-orange-800';
      case 'installed': return 'bg-green-100 text-green-800';
      case 'unknown': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredPieces = pieceMarks.filter(piece => {
    const matchesSearch = searchTerm === '' || 
      piece.mark.toLowerCase().includes(searchTerm.toLowerCase()) ||
      piece.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = selectedLocation === 'all' || 
      piece.field_location === selectedLocation;
    
    return matchesSearch && matchesLocation;
  });

  const locationStats = {
    yard: pieceMarks.filter(p => p.field_location === 'yard').length,
    staging: pieceMarks.filter(p => p.field_location === 'staging').length,
    crane_zone: pieceMarks.filter(p => p.field_location === 'crane_zone').length,
    installed: pieceMarks.filter(p => p.field_location === 'installed').length,
    unknown: pieceMarks.filter(p => !p.field_location || p.field_location === 'unknown').length,
  };

  return (
    <div className="space-y-4">
      {/* Location Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(locationStats).map(([location, count]) => (
          <div
            key={location}
            onClick={() => setSelectedLocation(location as PieceLocation)}
            className={`p-3 rounded-lg shadow cursor-pointer transition-all ${
              selectedLocation === location 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'bg-white hover:shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{getLocationIcon(location as PieceLocation)}</span>
              <span className="text-2xl font-bold">{count}</span>
            </div>
            <p className="text-sm font-medium mt-1 capitalize">{location.replace('_', ' ')}</p>
          </div>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search piece marks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setSelectedLocation('all')}
            className={`px-4 py-2 rounded-lg ${
              selectedLocation === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Show All
          </button>
        </div>
      </div>

      {/* Piece Marks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPieces.map(piece => (
          <div
            key={piece.id}
            className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">{piece.mark}</h3>
                <p className="text-sm text-gray-600">{piece.description}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                getLocationColor((piece as any).field_location || 'unknown')
              }`}>
                {getLocationIcon((piece as any).field_location || 'unknown')} {(piece as any).field_location || 'Unknown'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-600">Quantity:</span>
                <span className="ml-1 font-medium">{piece.quantity}</span>
              </div>
              <div>
                <span className="text-gray-600">Weight:</span>
                <span className="ml-1 font-medium">{piece.total_weight?.toFixed(0)} lbs</span>
              </div>
            </div>

            {movingPiece === piece.id ? (
              <div className="space-y-2">
                <select
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value as PieceLocation)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="yard">Yard</option>
                  <option value="staging">Staging Area</option>
                  <option value="crane_zone">Crane Zone</option>
                  <option value="installed">Installed</option>
                  <option value="unknown">Unknown</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleLocationUpdate(piece.id, newLocation)}
                    className="flex-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Update
                  </button>
                  <button
                    onClick={() => setMovingPiece(null)}
                    className="flex-1 px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMovingPiece(piece.id);
                  setNewLocation((piece as any).field_location || 'yard');
                }}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Update Location
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-bold mb-3">Recent Field Activities</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-gray-500">No recent activities</p>
          ) : (
            activities.map(activity => (
              <div key={activity.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-xl">
                    {activity.activity_type === 'moved' && '📦'}
                    {activity.activity_type === 'installed' && '✅'}
                    {activity.activity_type === 'received' && '📥'}
                    {activity.activity_type === 'inspection' && '🔍'}
                    {activity.activity_type === 'issue' && '⚠️'}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {activity.location && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    getLocationColor(activity.location)
                  }`}>
                    {activity.location}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};