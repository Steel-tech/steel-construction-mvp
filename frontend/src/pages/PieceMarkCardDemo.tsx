import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieceMarkCard } from '../components/piecemarks/PieceMarkCard';
import { PieceMark } from '../types/database.types';

export const PieceMarkCardDemo: React.FC = () => {
  const navigate = useNavigate();
  
  // Sample piece marks for demonstration
  const [pieceMarks] = useState<PieceMark[]>([
    {
      id: 'demo-1',
      project_id: 'project-123',
      mark: 'B1-C3',
      description: 'Column Base Plate - Level 1, Grid C3',
      quantity: 4,
      weight_per_piece: 125.5,
      total_weight: 502,
      material_type: 'A36 Steel Plate 1" x 24" x 24"',
      status: 'fabricating',
      drawing_number: 'S-101',
      sequence_number: 15,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      project_id: 'project-123',
      mark: 'W12x26-B',
      description: 'Wide Flange Beam - Second Floor',
      quantity: 8,
      weight_per_piece: 312,
      total_weight: 2496,
      material_type: 'W12x26 ASTM A992',
      status: 'shipped',
      field_location: 'staging',
      drawing_number: 'S-201',
      sequence_number: 45,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'demo-3',
      project_id: 'project-123',
      mark: 'HSS6x6-A',
      description: 'HSS Column - Entrance Canopy',
      quantity: 6,
      weight_per_piece: 185,
      total_weight: 1110,
      material_type: 'HSS6x6x1/4 ASTM A500',
      status: 'completed',
      drawing_number: 'S-301',
      sequence_number: 78,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  const [selectedView, setSelectedView] = useState<'full' | 'compact'>('full');
  const [showActions, setShowActions] = useState(true);

  const handlePieceMarkUpdate = (updatedPieceMark: PieceMark) => {
    console.log('Piece mark updated:', updatedPieceMark);
    // In a real app, this would update the state or refetch data
  };

  const handlePhotoUpload = (photoUrl: string) => {
    console.log('Photo uploaded:', photoUrl);
    // In a real app, this would trigger additional actions
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
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
              <h1 className="text-xl font-semibold">PieceMarkCard Component Demo</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Demo Controls</h2>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View Mode
              </label>
              <select
                value={selectedView}
                onChange={(e) => setSelectedView(e.target.value as 'full' | 'compact')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="full">Full Card</option>
                <option value="compact">Compact Card</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Show Actions
              </label>
              <button
                onClick={() => setShowActions(!showActions)}
                className={`px-4 py-2 rounded-md font-medium ${
                  showActions 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showActions ? 'Actions ON' : 'Actions OFF'}
              </button>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Component Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>QR Code generation with download</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Status update buttons</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Location tracking for field</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Photo upload with drag & drop</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Photo gallery view</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Role-based permissions</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Responsive design</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Real-time status updates</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span>Compact & full view modes</span>
            </div>
          </div>
        </div>

        {/* Demo Cards */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Sample Piece Mark Cards</h3>
          
          {selectedView === 'full' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pieceMarks.map((pieceMark) => (
                <PieceMarkCard
                  key={pieceMark.id}
                  pieceMark={pieceMark}
                  onUpdate={handlePieceMarkUpdate}
                  onPhotoUpload={handlePhotoUpload}
                  showActions={showActions}
                  compact={false}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pieceMarks.map((pieceMark) => (
                <PieceMarkCard
                  key={pieceMark.id}
                  pieceMark={pieceMark}
                  onUpdate={handlePieceMarkUpdate}
                  onPhotoUpload={handlePhotoUpload}
                  showActions={showActions}
                  compact={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Usage Example */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">Usage Example</h3>
          <pre className="text-green-400 text-sm overflow-x-auto">
{`import { PieceMarkCard } from '../components/piecemarks/PieceMarkCard';

// In your component:
<PieceMarkCard
  pieceMark={pieceMarkData}
  onUpdate={(updated) => handleUpdate(updated)}
  onPhotoUpload={(url) => handlePhotoUpload(url)}
  showActions={true}
  compact={false}
/>

// Features:
// - QR Code: Click QR button to show/hide, download available
// - Status Updates: Click status buttons to update
// - Location: Update location when status is "shipped"
// - Photos: Drag & drop or click to upload (max 5 files, 10MB each)
// - Gallery: View uploaded photos in grid layout
// - Responsive: Adapts to mobile and desktop screens`}
          </pre>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Technical Implementation</h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong className="text-gray-700">QR Code Library:</strong>
              <span className="ml-2 text-gray-600">qrcode (npm package)</span>
            </div>
            <div>
              <strong className="text-gray-700">File Upload:</strong>
              <span className="ml-2 text-gray-600">react-dropzone with Supabase Storage</span>
            </div>
            <div>
              <strong className="text-gray-700">State Management:</strong>
              <span className="ml-2 text-gray-600">React useState hooks</span>
            </div>
            <div>
              <strong className="text-gray-700">Styling:</strong>
              <span className="ml-2 text-gray-600">Tailwind CSS utility classes</span>
            </div>
            <div>
              <strong className="text-gray-700">Database:</strong>
              <span className="ml-2 text-gray-600">Supabase PostgreSQL with real-time subscriptions</span>
            </div>
            <div>
              <strong className="text-gray-700">Image Compression:</strong>
              <span className="ml-2 text-gray-600">Client-side canvas API (in storage service)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};