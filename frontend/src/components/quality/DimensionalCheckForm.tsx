import React, { useState } from 'react';
import type { DimensionalCheckFormData } from '../../types/quality.types';
import { qualityService } from '../../services/quality.service';

interface DimensionalCheckFormProps {
  inspectionId: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface DimensionInput {
  nominal: number;
  actual: number;
  tolerance: number;
}

export const DimensionalCheckForm: React.FC<DimensionalCheckFormProps> = ({
  inspectionId,
  onComplete,
  onCancel,
}) => {
  const [formData, setFormData] = useState<DimensionalCheckFormData>({
    overall_dimensions: {
      length: { nominal: 0, actual: 0, tolerance: 3 },
      width: { nominal: 0, actual: 0, tolerance: 2 },
      height: { nominal: 0, actual: 0, tolerance: 2 },
    },
    hole_patterns: {
      diameter: { nominal: 0, actual: 0, tolerance: 1 },
      spacing: { nominal: 0, actual: 0, tolerance: 1 },
      edge_distance: { nominal: 0, actual: 0, tolerance: 2 },
    },
    straightness: {
      camber: { nominal: 0, actual: 0, tolerance: 3 },
      sweep: { nominal: 0, actual: 0, tolerance: 3 },
      twist: { nominal: 0, actual: 0, tolerance: 1 },
    },
  });

  const [activeSection, setActiveSection] = useState<'overall' | 'holes' | 'straightness'>('overall');
  const [submitting, setSubmitting] = useState(false);

  const handleDimensionChange = (
    section: 'overall_dimensions' | 'hole_patterns' | 'straightness',
    dimension: string,
    field: keyof DimensionInput,
    value: number
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [dimension]: {
          ...prev[section]![dimension as keyof typeof prev[typeof section]],
          [field]: value,
        },
      },
    }));
  };

  const calculateDeviation = (actual: number, nominal: number): number => {
    return actual - nominal;
  };

  const getToleranceStatus = (actual: number, nominal: number, tolerance: number): string => {
    const deviation = Math.abs(actual - nominal);
    if (deviation <= tolerance) return 'pass';
    if (deviation <= tolerance * 1.2) return 'marginal';
    return 'fail';
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pass': return 'text-green-600 bg-green-50';
      case 'marginal': return 'text-yellow-600 bg-yellow-50';
      case 'fail': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await qualityService.createDimensionalChecks(inspectionId, formData);
      onComplete();
    } catch (error) {
      console.error('Failed to create dimensional checks:', error);
      alert('Failed to submit dimensional checks');
    } finally {
      setSubmitting(false);
    }
  };

  const renderDimensionInput = (
    section: 'overall_dimensions' | 'hole_patterns' | 'straightness',
    dimension: string,
    label: string,
    unit: string = 'mm'
  ) => {
    const values = formData[section]?.[dimension as keyof typeof formData[typeof section]] as DimensionInput | undefined;
    if (!values) return null;

    const deviation = values.actual ? calculateDeviation(values.actual, values.nominal) : 0;
    const status = values.actual && values.nominal ? 
      getToleranceStatus(values.actual, values.nominal, values.tolerance) : '';

    return (
      <div className="bg-white border rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">{label}</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nominal ({unit})
            </label>
            <input
              type="number"
              value={values.nominal || ''}
              onChange={(e) => handleDimensionChange(section, dimension, 'nominal', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Actual ({unit})
            </label>
            <input
              type="number"
              value={values.actual || ''}
              onChange={(e) => handleDimensionChange(section, dimension, 'actual', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tolerance (±{unit})
            </label>
            <input
              type="number"
              value={values.tolerance || ''}
              onChange={(e) => handleDimensionChange(section, dimension, 'tolerance', parseFloat(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              step="0.1"
              min="0"
              required
            />
          </div>

          <div className="flex flex-col justify-center">
            {values.actual && values.nominal ? (
              <div className={`p-2 rounded-md text-center ${getStatusColor(status)}`}>
                <div className="text-xs font-medium uppercase">{status}</div>
                <div className="text-sm">
                  {deviation > 0 ? '+' : ''}{deviation.toFixed(1)} {unit}
                </div>
              </div>
            ) : (
              <div className="p-2 rounded-md text-center bg-gray-50 text-gray-400">
                <div className="text-xs">Enter values</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              type="button"
              onClick={() => setActiveSection('overall')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeSection === 'overall'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overall Dimensions
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('holes')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeSection === 'holes'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Hole Patterns
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('straightness')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeSection === 'straightness'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Straightness
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overall Dimensions Section */}
          {activeSection === 'overall' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Overall Dimensions</h3>
              {renderDimensionInput('overall_dimensions', 'length', 'Length')}
              {renderDimensionInput('overall_dimensions', 'width', 'Width')}
              {renderDimensionInput('overall_dimensions', 'height', 'Height')}
              {renderDimensionInput('overall_dimensions', 'diagonal', 'Diagonal (Optional)')}
            </div>
          )}

          {/* Hole Patterns Section */}
          {activeSection === 'holes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hole Patterns</h3>
              {renderDimensionInput('hole_patterns', 'diameter', 'Hole Diameter')}
              {renderDimensionInput('hole_patterns', 'spacing', 'Hole Spacing')}
              {renderDimensionInput('hole_patterns', 'edge_distance', 'Edge Distance')}
            </div>
          )}

          {/* Straightness Section */}
          {activeSection === 'straightness' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Straightness Checks</h3>
              {renderDimensionInput('straightness', 'camber', 'Camber')}
              {renderDimensionInput('straightness', 'sweep', 'Sweep')}
              {renderDimensionInput('straightness', 'twist', 'Twist', 'degrees')}
            </div>
          )}
        </div>
      </div>

      {/* Measurement Summary */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Measurement Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Overall Dimensions Summary */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Overall</h4>
            {Object.entries(formData.overall_dimensions).map(([key, values]) => {
              if (!values || !values.actual || !values.nominal) return null;
              const status = getToleranceStatus(values.actual, values.nominal, values.tolerance);
              return (
                <div key={key} className="flex justify-between items-center py-1">
                  <span className="text-sm capitalize">{key}:</span>
                  <span className={`text-sm font-medium ${
                    status === 'pass' ? 'text-green-600' :
                    status === 'marginal' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hole Patterns Summary */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Holes</h4>
            {formData.hole_patterns && Object.entries(formData.hole_patterns).map(([key, values]) => {
              if (!values || !values.actual || !values.nominal) return null;
              const status = getToleranceStatus(values.actual, values.nominal, values.tolerance);
              return (
                <div key={key} className="flex justify-between items-center py-1">
                  <span className="text-sm capitalize">{key.replace('_', ' ')}:</span>
                  <span className={`text-sm font-medium ${
                    status === 'pass' ? 'text-green-600' :
                    status === 'marginal' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Straightness Summary */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Straightness</h4>
            {formData.straightness && Object.entries(formData.straightness).map(([key, values]) => {
              if (!values || !values.actual || !values.nominal) return null;
              const status = getToleranceStatus(values.actual, values.nominal, values.tolerance);
              return (
                <div key={key} className="flex justify-between items-center py-1">
                  <span className="text-sm capitalize">{key}:</span>
                  <span className={`text-sm font-medium ${
                    status === 'pass' ? 'text-green-600' :
                    status === 'marginal' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
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
          {submitting ? 'Submitting...' : 'Submit Measurements'}
        </button>
      </div>
    </form>
  );
};