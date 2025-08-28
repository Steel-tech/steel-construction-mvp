import React, { useState } from 'react';
import type { WeldingInspectionFormData, WeldType, WeldPosition, ItemResult } from '../../types/quality.types';
import { qualityService } from '../../services/quality.service';

interface WeldingInspectionFormProps {
  inspectionId: string;
  onComplete: () => void;
  onCancel: () => void;
}

const weldTypes: WeldType[] = ['fillet', 'groove', 'plug', 'slot', 'spot', 'seam'];
const weldPositions: WeldPosition[] = ['1F', '2F', '3F', '4F', '1G', '2G', '3G', '4G', '5G', '6G'];

export const WeldingInspectionForm: React.FC<WeldingInspectionFormProps> = ({
  inspectionId,
  onComplete,
  onCancel,
}) => {
  const [formData, setFormData] = useState<WeldingInspectionFormData>({
    weld_type: 'fillet',
    weld_position: '1F',
    electrode_type: '',
    welder_id: '',
    wps_number: '',
    visual_checks: {
      profile: 'pass',
      size: 'pass',
      undercut: 'pass',
      overlap: 'pass',
      cracks: 'pass',
      porosity: 'pass',
      spatter: 'pass',
    },
    measurements: {
      weld_size_required: 6,
      weld_size_actual: 6,
      undercut_depth: 0,
    },
    testing: {
      penetration_test: undefined,
      magnetic_particle: undefined,
      ultrasonic_test: undefined,
      radiographic_test: undefined,
    },
  });

  const [submitting, setSubmitting] = useState(false);

  const handleVisualCheck = (check: keyof typeof formData.visual_checks, result: ItemResult) => {
    setFormData(prev => ({
      ...prev,
      visual_checks: {
        ...prev.visual_checks,
        [check]: result,
      },
    }));
  };

  const handleMeasurement = (field: keyof typeof formData.measurements, value: number) => {
    setFormData(prev => ({
      ...prev,
      measurements: {
        ...prev.measurements,
        [field]: value,
      },
    }));
  };

  const handleTesting = (test: keyof typeof formData.testing, result: ItemResult | undefined) => {
    setFormData(prev => ({
      ...prev,
      testing: {
        ...prev.testing,
        [test]: result,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await qualityService.createWeldingInspection(inspectionId, formData);
      onComplete();
    } catch (error) {
      console.error('Failed to create welding inspection:', error);
      alert('Failed to submit welding inspection');
    } finally {
      setSubmitting(false);
    }
  };

  const getResultColor = (result: ItemResult) => {
    switch (result) {
      case 'pass': return 'bg-green-100 border-green-500 text-green-700';
      case 'fail': return 'bg-red-100 border-red-500 text-red-700';
      case 'conditional': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'na': return 'bg-gray-100 border-gray-500 text-gray-700';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Weld Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Weld Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Weld Type</label>
            <select
              value={formData.weld_type}
              onChange={(e) => setFormData(prev => ({ ...prev, weld_type: e.target.value as WeldType }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              {weldTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Weld Position</label>
            <select
              value={formData.weld_position}
              onChange={(e) => setFormData(prev => ({ ...prev, weld_position: e.target.value as WeldPosition }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              {weldPositions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Electrode Type</label>
            <input
              type="text"
              value={formData.electrode_type}
              onChange={(e) => setFormData(prev => ({ ...prev, electrode_type: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="E7018"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Welder ID</label>
            <input
              type="text"
              value={formData.welder_id}
              onChange={(e) => setFormData(prev => ({ ...prev, welder_id: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="W-123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">WPS Number</label>
            <input
              type="text"
              value={formData.wps_number}
              onChange={(e) => setFormData(prev => ({ ...prev, wps_number: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="WPS-001"
              required
            />
          </div>
        </div>
      </div>

      {/* Visual Inspection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Visual Inspection</h3>
        
        <div className="space-y-3">
          {Object.entries(formData.visual_checks).map(([check, result]) => (
            <div key={check} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium capitalize">
                {check.replace('_', ' ')}
              </span>
              <div className="flex gap-2">
                {(['pass', 'fail', 'conditional', 'na'] as ItemResult[]).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleVisualCheck(check as keyof typeof formData.visual_checks, option)}
                    className={`px-3 py-1 rounded-md border transition-colors ${
                      result === option ? getResultColor(option) : 'bg-white border-gray-300'
                    }`}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dimensional Measurements */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dimensional Measurements</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Required Weld Size (mm)
            </label>
            <input
              type="number"
              value={formData.measurements.weld_size_required}
              onChange={(e) => handleMeasurement('weld_size_required', parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Actual Weld Size (mm)
            </label>
            <input
              type="number"
              value={formData.measurements.weld_size_actual}
              onChange={(e) => handleMeasurement('weld_size_actual', parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.5"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Undercut Depth (mm)
            </label>
            <input
              type="number"
              value={formData.measurements.undercut_depth || 0}
              onChange={(e) => handleMeasurement('undercut_depth', parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.1"
              min="0"
            />
          </div>
        </div>
      </div>

      {/* Non-Destructive Testing */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Non-Destructive Testing</h3>
        
        <div className="space-y-3">
          {[
            { key: 'penetration_test', label: 'Dye Penetrant Test' },
            { key: 'magnetic_particle', label: 'Magnetic Particle Test' },
            { key: 'ultrasonic_test', label: 'Ultrasonic Test' },
            { key: 'radiographic_test', label: 'Radiographic Test' },
          ].map(test => (
            <div key={test.key} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="font-medium">{test.label}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTesting(test.key as keyof typeof formData.testing, undefined)}
                  className={`px-3 py-1 rounded-md border transition-colors ${
                    formData.testing[test.key as keyof typeof formData.testing] === undefined
                      ? 'bg-gray-100 border-gray-500 text-gray-700'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  N/A
                </button>
                {(['pass', 'fail'] as ItemResult[]).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleTesting(test.key as keyof typeof formData.testing, option)}
                    className={`px-3 py-1 rounded-md border transition-colors ${
                      formData.testing[test.key as keyof typeof formData.testing] === option
                        ? getResultColor(option)
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Inspection'}
        </button>
      </div>
    </form>
  );
};