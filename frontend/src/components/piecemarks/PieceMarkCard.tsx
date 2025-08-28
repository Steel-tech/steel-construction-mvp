import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useDropzone } from 'react-dropzone';
import type { PieceMark, PieceMarkStatus } from '../../types/database.types';
import type { PieceLocation } from '../../types/field.types';
import { pieceMarkService } from '../../services/pieceMarkService';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

interface PieceMarkCardProps {
  pieceMark: PieceMark;
  onUpdate?: (updatedPieceMark: PieceMark) => void;
  onPhotoUpload?: (photoUrl: string) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const PieceMarkCard: React.FC<PieceMarkCardProps> = ({
  pieceMark,
  onUpdate,
  onPhotoUpload,
  showActions = true,
  compact = false,
}) => {
  const { user, profile } = useAuth();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PieceMarkStatus>(pieceMark.status);
  const [currentLocation, setCurrentLocation] = useState<PieceLocation>((pieceMark as any).field_location || 'unknown');

  // Generate QR Code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const data = JSON.stringify({
          id: pieceMark.id,
          mark: pieceMark.mark,
          project: pieceMark.project_id,
          url: `${window.location.origin}/scan/${pieceMark.id}`
        });
        const url = await QRCode.toDataURL(data, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };
    generateQR();
  }, [pieceMark.id, pieceMark.mark, pieceMark.project_id]);

  // Fetch existing photos
  useEffect(() => {
    fetchPhotos();
  }, [pieceMark.id]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_photos')
        .select('photo_url')
        .eq('piece_mark_id', pieceMark.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploadedPhotos(data?.map(p => p.photo_url) || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    }
  };

  // Photo upload with Dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDrop: async (acceptedFiles) => {
      if (!user) return;
      
      setUploadingPhoto(true);
      try {
        for (const file of acceptedFiles) {
          const fileName = `${pieceMark.project_id}/${pieceMark.id}/${Date.now()}-${file.name}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('piece-photos')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('piece-photos')
            .getPublicUrl(fileName);

          // Save photo reference in database
          const { error: dbError } = await supabase
            .from('progress_photos')
            .insert({
              project_id: pieceMark.project_id,
              piece_mark_id: pieceMark.id,
              photo_url: publicUrl,
              uploaded_by: user.id,
              caption: `${pieceMark.mark} - ${new Date().toLocaleDateString()}`,
            });

          if (dbError) throw dbError;

          setUploadedPhotos(prev => [publicUrl, ...prev]);
          onPhotoUpload?.(publicUrl);
        }
      } catch (error) {
        console.error('Error uploading photos:', error);
        alert('Failed to upload photos. Please try again.');
      } finally {
        setUploadingPhoto(false);
      }
    },
  });

  // Status update handler
  const handleStatusUpdate = async (newStatus: PieceMarkStatus) => {
    if (!user) return;
    
    setUpdatingStatus(true);
    try {
      const updatedMark = await pieceMarkService.updateStatus(pieceMark.id, newStatus);
      setSelectedStatus(newStatus);
      
      // Log activity
      await supabase.from('field_activities').insert({
        project_id: pieceMark.project_id,
        piece_mark_id: pieceMark.id,
        activity_type: 'moved',
        description: `Status updated to ${newStatus}`,
        user_id: user.id,
      });

      onUpdate?.(updatedMark);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Location update handler
  const handleLocationUpdate = async (newLocation: PieceLocation) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('piece_marks')
        .update({ field_location: newLocation })
        .eq('id', pieceMark.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentLocation(newLocation);
      
      // Log activity
      await supabase.from('field_activities').insert({
        project_id: pieceMark.project_id,
        piece_mark_id: pieceMark.id,
        activity_type: 'moved',
        description: `Location updated to ${newLocation}`,
        location: newLocation,
        user_id: user.id,
      });

      onUpdate?.(data);
    } catch (error) {
      console.error('Error updating location:', error);
      alert('Failed to update location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PieceMarkStatus) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'fabricating': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'installed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const canEdit = ['admin', 'project_manager', 'shop', 'field'].includes(profile?.role || '');

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-bold text-lg">{pieceMark.mark}</h3>
            <p className="text-sm text-gray-600">{pieceMark.description}</p>
          </div>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(pieceMark.status)}`}>
            {pieceMark.status.replace('_', ' ')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Qty: {pieceMark.quantity}</span>
          <span>{pieceMark.total_weight?.toFixed(0)} lbs</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold">{pieceMark.mark}</h2>
            <p className="text-blue-100 mt-1">{pieceMark.description}</p>
          </div>
          <button
            onClick={() => setShowQR(!showQR)}
            className="p-2 bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-colors"
            title="Toggle QR Code"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4z"/>
              <path d="M11 11h3v3h-3v-3zM14 16h3v3h-3v-3zM11 16h2v3h-2v-3z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* QR Code Display */}
      {showQR && (
        <div className="p-4 bg-gray-50 border-b flex justify-center">
          <div className="text-center">
            <img src={qrCodeUrl} alt="QR Code" className="mx-auto" />
            <p className="text-xs text-gray-600 mt-2">Scan to update status</p>
            <button
              onClick={() => {
                const link = document.createElement('a');
                link.download = `${pieceMark.mark}-qr.png`;
                link.href = qrCodeUrl;
                link.click();
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Download QR Code
            </button>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gray-600">Quantity</p>
          <p className="font-semibold">{pieceMark.quantity} pcs</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Weight</p>
          <p className="font-semibold">{pieceMark.total_weight?.toFixed(0)} lbs</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Material</p>
          <p className="font-semibold">{pieceMark.material_type || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Drawing</p>
          <p className="font-semibold">{pieceMark.drawing_number || 'N/A'}</p>
        </div>
      </div>

      {/* Status and Location */}
      <div className="px-4 pb-4 space-y-4">
        {/* Current Status */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Current Status</p>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedStatus)}`}>
              {selectedStatus.replace('_', ' ').toUpperCase()}
            </span>
            {pieceMark.status === 'shipped' && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLocationColor(currentLocation)}`}>
                📍 {currentLocation.replace('_', ' ').toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Status Update Buttons */}
        {showActions && canEdit && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Update Status</p>
            <div className="flex flex-wrap gap-2">
              {(['not_started', 'fabricating', 'completed', 'shipped', 'installed'] as PieceMarkStatus[]).map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updatingStatus || selectedStatus === status}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    selectedStatus === status
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {updatingStatus && selectedStatus !== status ? (
                    <span className="inline-block animate-spin">⏳</span>
                  ) : (
                    status.replace('_', ' ')
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location Update (for field workers) */}
        {showActions && pieceMark.status === 'shipped' && ['field', 'project_manager', 'admin'].includes(profile?.role || '') && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Update Location</p>
            <div className="flex flex-wrap gap-2">
              {(['yard', 'staging', 'crane_zone', 'installed'] as PieceLocation[]).map(location => (
                <button
                  key={location}
                  onClick={() => handleLocationUpdate(location)}
                  disabled={loading || currentLocation === location}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    currentLocation === location
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {loading && currentLocation !== location ? (
                    <span className="inline-block animate-spin">⏳</span>
                  ) : (
                    location.replace('_', ' ')
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Photo Upload Section */}
        {showActions && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-600">Photos ({uploadedPhotos.length})</p>
              {uploadedPhotos.length > 0 && (
                <button
                  onClick={() => setShowPhotoGallery(!showPhotoGallery)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showPhotoGallery ? 'Hide' : 'Show'} Gallery
                </button>
              )}
            </div>

            {/* Dropzone for photo upload */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              {uploadingPhoto ? (
                <div className="flex items-center justify-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>Uploading...</span>
                </div>
              ) : isDragActive ? (
                <p className="text-blue-600">Drop photos here...</p>
              ) : (
                <div>
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                  </svg>
                  <p className="text-sm text-gray-600">
                    Drag & drop photos here, or click to select
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max 5 files, 10MB each
                  </p>
                </div>
              )}
            </div>

            {/* Photo Gallery */}
            {showPhotoGallery && uploadedPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {uploadedPhotos.slice(0, 6).map((photo, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={photo}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover rounded cursor-pointer hover:opacity-90"
                      onClick={() => window.open(photo, '_blank')}
                    />
                  </div>
                ))}
                {uploadedPhotos.length > 6 && (
                  <div className="flex items-center justify-center bg-gray-100 rounded">
                    <span className="text-gray-600">+{uploadedPhotos.length - 6} more</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with timestamps */}
      <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Created: {new Date(pieceMark.created_at).toLocaleDateString()}</span>
          <span>Updated: {new Date(pieceMark.updated_at).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};