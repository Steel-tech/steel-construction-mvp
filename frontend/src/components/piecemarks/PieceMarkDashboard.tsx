import React from 'react';
import { PieceMark, PieceMarkStatus } from '../../types/database.types';

interface PieceMarkDashboardProps {
  pieceMarks: PieceMark[];
  projectName?: string;
}

export const PieceMarkDashboard: React.FC<PieceMarkDashboardProps> = ({ 
  pieceMarks, 
  projectName 
}) => {
  const getStatistics = () => {
    const stats = {
      totalMarks: pieceMarks.length,
      totalPieces: 0,
      totalWeight: 0,
      byStatus: {
        not_started: 0,
        fabricating: 0,
        completed: 0,
        shipped: 0,
        installed: 0,
      } as Record<PieceMarkStatus, number>,
      progressPercentage: 0,
    };

    pieceMarks.forEach(mark => {
      stats.totalPieces += mark.quantity;
      stats.totalWeight += mark.total_weight || 0;
      stats.byStatus[mark.status] += mark.quantity;
    });

    // Calculate progress percentage (completed + shipped + installed)
    const completedPieces = stats.byStatus.completed + stats.byStatus.shipped + stats.byStatus.installed;
    stats.progressPercentage = stats.totalPieces > 0 
      ? Math.round((completedPieces / stats.totalPieces) * 100)
      : 0;

    return stats;
  };

  const stats = getStatistics();

  const statusConfig = [
    { status: 'not_started', label: 'Not Started', color: 'bg-gray-200', icon: '⏳' },
    { status: 'fabricating', label: 'Fabricating', color: 'bg-yellow-200', icon: '🔨' },
    { status: 'completed', label: 'Completed', color: 'bg-green-200', icon: '✅' },
    { status: 'shipped', label: 'Shipped', color: 'bg-blue-200', icon: '🚚' },
    { status: 'installed', label: 'Installed', color: 'bg-purple-200', icon: '🏗️' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Piece Mark Dashboard
        </h2>
        {projectName && (
          <p className="text-gray-600">Project: {projectName}</p>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Marks</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalMarks}</p>
            </div>
            <div className="text-4xl">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pieces</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalPieces}</p>
            </div>
            <div className="text-4xl">🔩</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Weight</p>
              <p className="text-3xl font-bold text-gray-900">
                {(stats.totalWeight / 1000).toFixed(1)}
                <span className="text-sm text-gray-600"> tons</span>
              </p>
            </div>
            <div className="text-4xl">⚖️</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.progressPercentage}%
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Overview</h3>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Overall Progress</span>
            <span>{stats.progressPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-500"
              style={{ width: `${stats.progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {statusConfig.map(({ status, label, color, icon }) => {
            const count = stats.byStatus[status as PieceMarkStatus];
            const percentage = stats.totalPieces > 0 
              ? Math.round((count / stats.totalPieces) * 100)
              : 0;

            return (
              <div key={status} className={`${color} rounded-lg p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <p className="text-xs text-gray-600">{percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Production Flow</h3>
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gray-300"></div>
          <div className="space-y-8">
            {statusConfig.map(({ status, label, color, icon }, index) => {
              const count = stats.byStatus[status as PieceMarkStatus];
              return (
                <div key={status} className="relative flex items-center">
                  <div className="flex-1 text-right pr-8">
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-gray-600">{count} pieces</p>
                  </div>
                  <div className={`absolute left-1/2 transform -translate-x-1/2 w-12 h-12 ${color} rounded-full flex items-center justify-center border-4 border-white shadow-lg z-10`}>
                    <span className="text-xl">{icon}</span>
                  </div>
                  <div className="flex-1 pl-8">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${color} h-2 rounded-full`}
                        style={{ 
                          width: `${stats.totalPieces > 0 ? (count / stats.totalPieces) * 100 : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 text-white">
        <h3 className="text-lg font-semibold mb-4">Quick Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm opacity-90">Ready to Fabricate</p>
            <p className="text-2xl font-bold">{stats.byStatus.not_started}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">In Production</p>
            <p className="text-2xl font-bold">{stats.byStatus.fabricating}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">Ready to Ship</p>
            <p className="text-2xl font-bold">{stats.byStatus.completed}</p>
          </div>
          <div>
            <p className="text-sm opacity-90">On Site</p>
            <p className="text-2xl font-bold">{stats.byStatus.shipped + stats.byStatus.installed}</p>
          </div>
        </div>
      </div>
    </div>
  );
};