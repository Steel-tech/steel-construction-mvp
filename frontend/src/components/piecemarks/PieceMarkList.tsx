import React, { useState } from 'react';
import type { PieceMark, PieceMarkStatus } from '../../types/database.types';
import { pieceMarkService } from '../../services/pieceMarkService';

interface PieceMarkListProps {
  pieceMarks: PieceMark[];
  onEdit: (pieceMark: PieceMark) => void;
  onDelete: (id: string) => void;
  onStatusUpdate: (id: string, status: PieceMarkStatus) => void;
  onRefresh: () => void;
  canEdit?: boolean;
}

export const PieceMarkList: React.FC<PieceMarkListProps> = ({
  pieceMarks,
  onEdit,
  onDelete,
  onStatusUpdate,
  onRefresh,
  canEdit = false,
}) => {
  const [selectedMarks, setSelectedMarks] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState<PieceMarkStatus>('not_started');
  const [loading, setLoading] = useState(false);

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

  // Removed unused getStatusIcon function

  const handleSelectAll = () => {
    if (selectedMarks.length === pieceMarks.length) {
      setSelectedMarks([]);
    } else {
      setSelectedMarks(pieceMarks.map(pm => pm.id));
    }
  };

  const handleSelectMark = (id: string) => {
    setSelectedMarks(prev => 
      prev.includes(id) 
        ? prev.filter(markId => markId !== id)
        : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async () => {
    if (selectedMarks.length === 0) return;
    
    setLoading(true);
    try {
      await pieceMarkService.bulkUpdateStatus(selectedMarks, bulkStatus);
      setSelectedMarks([]);
      onRefresh();
    } catch (error) {
      console.error('Failed to update piece marks:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalWeight = (marks: PieceMark[]) => {
    return marks.reduce((total, mark) => total + (mark.total_weight || 0), 0);
  };

  const getStatusCounts = () => {
    const counts: Record<PieceMarkStatus, number> = {
      not_started: 0,
      fabricating: 0,
      completed: 0,
      shipped: 0,
      installed: 0,
    };

    pieceMarks.forEach(mark => {
      counts[mark.status] += mark.quantity;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();
  const totalPieces = pieceMarks.reduce((sum, mark) => sum + mark.quantity, 0);
  const totalWeight = calculateTotalWeight(pieceMarks);

  return (
    <div className="space-y-4">
      {/* Statistics Bar */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Marks</p>
            <p className="text-2xl font-bold">{pieceMarks.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Pieces</p>
            <p className="text-2xl font-bold">{totalPieces}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Weight</p>
            <p className="text-2xl font-bold">{totalWeight.toFixed(0)} lbs</p>
          </div>
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="text-center">
              <p className="text-sm text-gray-600">{status.replace('_', ' ')}</p>
              <p className="text-xl font-semibold">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      {canEdit && selectedMarks.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
          <span className="text-sm text-blue-700">
            {selectedMarks.length} piece mark{selectedMarks.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center space-x-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as PieceMarkStatus)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              disabled={loading}
            >
              <option value="not_started">Not Started</option>
              <option value="fabricating">Fabricating</option>
              <option value="completed">Completed</option>
              <option value="shipped">Shipped</option>
              <option value="installed">Installed</option>
            </select>
            <button
              onClick={handleBulkStatusUpdate}
              className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {canEdit && (
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedMarks.length === pieceMarks.length && pieceMarks.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mark
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weight
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Material
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Drawing
              </th>
              {canEdit && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pieceMarks.map((pieceMark) => (
              <tr key={pieceMark.id} className="hover:bg-gray-50">
                {canEdit && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedMarks.includes(pieceMark.id)}
                      onChange={() => handleSelectMark(pieceMark.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pieceMark.mark}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {pieceMark.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pieceMark.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pieceMark.total_weight ? `${pieceMark.total_weight.toFixed(2)} lbs` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pieceMark.material_type || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={pieceMark.status}
                    onChange={(e) => onStatusUpdate(pieceMark.id, e.target.value as PieceMarkStatus)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pieceMark.status)}`}
                    disabled={!canEdit}
                  >
                    <option value="not_started">⏳ Not Started</option>
                    <option value="fabricating">🔨 Fabricating</option>
                    <option value="completed">✅ Completed</option>
                    <option value="shipped">🚚 Shipped</option>
                    <option value="installed">🏗️ Installed</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {pieceMark.drawing_number || '-'}
                </td>
                {canEdit && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => onEdit(pieceMark)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(pieceMark.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};