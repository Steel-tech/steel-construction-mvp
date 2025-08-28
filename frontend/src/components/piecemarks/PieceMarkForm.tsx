import React, { useState } from 'react';
import { PieceMark, PieceMarkStatus } from '../../types/database.types';

interface PieceMarkFormProps {
  projectId: string;
  initialData?: Partial<PieceMark>;
  onSubmit: (data: Partial<PieceMark>) => Promise<void>;
  onCancel: () => void;
}

export const PieceMarkForm: React.FC<PieceMarkFormProps> = ({
  projectId,
  initialData,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    mark: initialData?.mark || '',
    description: initialData?.description || '',
    quantity: initialData?.quantity || 1,
    weight_per_piece: initialData?.weight_per_piece || 0,
    material_type: initialData?.material_type || '',
    status: initialData?.status || 'not_started' as PieceMarkStatus,
    drawing_number: initialData?.drawing_number || '',
    sequence_number: initialData?.sequence_number || 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        ...formData,
        project_id: projectId,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save piece mark');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Piece Mark *
            <input
              type="text"
              name="mark"
              value={formData.mark}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
              required
              disabled={loading}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Quantity *
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
              required
              disabled={loading}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Weight per Piece (lbs)
            <input
              type="number"
              name="weight_per_piece"
              value={formData.weight_per_piece}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
              disabled={loading}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Material Type
            <input
              type="text"
              name="material_type"
              value={formData.material_type}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
              placeholder="e.g., W12x26, HSS4x4x1/4"
              disabled={loading}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Drawing Number
            <input
              type="text"
              name="drawing_number"
              value={formData.drawing_number}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
              disabled={loading}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sequence Number
            <input
              type="number"
              name="sequence_number"
              value={formData.sequence_number}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
              disabled={loading}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
              disabled={loading}
            >
              <option value="not_started">Not Started</option>
              <option value="fabricating">Fabricating</option>
              <option value="completed">Completed</option>
              <option value="shipped">Shipped</option>
              <option value="installed">Installed</option>
            </select>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            disabled={loading}
          />
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Saving...' : initialData ? 'Update' : 'Create'} Piece Mark
        </button>
      </div>
    </form>
  );
};