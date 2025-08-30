import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QualityChecklist } from '../../components/quality/QualityChecklist';
import type { PieceMark } from '../../types/database.types';
import type { QualityInspection } from '../../types/quality.types';

export const QualityControlDemo: React.FC = () => {
  const navigate = useNavigate();
  const [showInspection, setShowInspection] = useState(false);
  const [selectedInspectionType, setSelectedInspectionType] = useState<'general' | 'welding' | 'dimensional'>('general');
  const [completedInspections, setCompletedInspections] = useState<QualityInspection[]>([]);

  // Sample piece mark data for demo
  const samplePieceMark: PieceMark = {
    id: 'demo-123',
    project_id: 'project-456',
    mark: 'B-101',
    description: 'W14x90 Beam - Level 2',
    quantity: 4,
    weight_each: 1250.5,
    weight_total: 5002.0,
    material_grade: 'A992',
    finish: 'Primed',
    status: 'in_production',
    phase: 'shop',
    sequence_number: 15,
    drawing_number: 'S-201',
    grid_line: 'B-4',
    level: '2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const inspectionTypes = [
    { value: 'general', label: 'General Inspection', icon: '📋', color: 'blue' },
    { value: 'welding', label: 'Welding Inspection', icon: '⚡', color: 'yellow' },
    { value: 'dimensional', label: 'Dimensional Check', icon: '📏', color: 'green' },
  ];

  const handleInspectionComplete = (inspection: QualityInspection) => {
    setCompletedInspections([...completedInspections, inspection]);
    setShowInspection(false);
    alert('Inspection completed successfully!');
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      passed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      conditional: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quality Control Demo</h1>
              <p className="text-gray-600">Steel Construction Quality Inspection System</p>
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
        {/* Piece Mark Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Sample Piece Mark</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Mark Number</p>
              <p className="text-xl font-bold text-indigo-600">{samplePieceMark.mark}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Description</p>
              <p className="font-medium">{samplePieceMark.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Material Grade</p>
              <p className="font-medium">{samplePieceMark.material_grade}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {samplePieceMark.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Weight</p>
              <p className="font-medium">{samplePieceMark.weight_each.toLocaleString()} lbs each</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Location</p>
              <p className="font-medium">Grid {samplePieceMark.grid_line}, Level {samplePieceMark.level}</p>
            </div>
          </div>
        </div>

        {/* Inspection Type Selection */}
        {!showInspection && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Select Inspection Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {inspectionTypes.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setSelectedInspectionType(type.value as 'general' | 'welding' | 'dimensional')}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedInspectionType === type.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <h3 className="font-medium text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {type.value === 'general' && 'Standard quality checklist'}
                    {type.value === 'welding' && 'Detailed weld inspection'}
                    {type.value === 'dimensional' && 'Verify measurements'}
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowInspection(true)}
              className="w-full mt-6 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
            >
              Start {inspectionTypes.find(t => t.value === selectedInspectionType)?.label}
            </button>
          </div>
        )}

        {/* Quality Checklist Component */}
        {showInspection && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <QualityChecklist
              pieceMark={{
                ...samplePieceMark,
                // Add custom property for demo
                ...(selectedInspectionType && { inspection_type: selectedInspectionType }),
              } as PieceMark & { inspection_type?: 'general' | 'welding' | 'dimensional' }}
              onInspectionComplete={handleInspectionComplete}
              onClose={() => setShowInspection(false)}
            />
          </div>
        )}

        {/* Completed Inspections */}
        {completedInspections.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Completed Inspections</h2>
            <div className="space-y-3">
              {completedInspections.map((inspection, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">
                        {inspection.inspection_type.charAt(0).toUpperCase() + inspection.inspection_type.slice(1)} Inspection
                      </p>
                      <p className="text-sm text-gray-600">
                        Completed at {new Date(inspection.updated_at || '').toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(inspection.status)}`}>
                        {inspection.status.toUpperCase()}
                      </span>
                      {inspection.overall_result && (
                        <span className="text-sm text-gray-600">
                          Result: {inspection.overall_result.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {inspection.notes && (
                    <p className="text-sm text-gray-700 mt-2">Notes: {inspection.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Highlights */}
        <div className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h2 className="text-xl font-bold mb-4">Quality Control Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">✅ Comprehensive Checklists</h3>
              <p className="text-indigo-100 text-sm">
                Customizable inspection templates for different quality checks
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📸 Photo Documentation</h3>
              <p className="text-indigo-100 text-sm">
                Capture and attach photos directly to inspection items
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⚡ Specialized Forms</h3>
              <p className="text-indigo-100 text-sm">
                Dedicated forms for welding and dimensional inspections
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📊 Instant Summary</h3>
              <p className="text-indigo-100 text-sm">
                Real-time pass/fail rates and issue severity tracking
              </p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">📝 Demo Instructions</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Select an inspection type (General, Welding, or Dimensional)</li>
            <li>• Click "Start Inspection" to open the quality control interface</li>
            <li>• For Welding inspections, use the dedicated welding tab for detailed checks</li>
            <li>• For Dimensional inspections, use the dimensional tab to verify measurements</li>
            <li>• Upload photos by dragging and dropping or clicking in the Photos tab</li>
            <li>• Review the inspection summary before completing</li>
            <li>• Click "Complete Inspection" to finalize and save the results</li>
          </ul>
        </div>
      </div>
    </div>
  );
};