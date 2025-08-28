import React, { useState, useEffect } from 'react';
import { ProductionWorkflow, ProductionStage, StageTransition } from '../../types/production.types';
import { productionService } from '../../services/production.service';

interface TimelineStageProps {
  stage: ProductionStage;
  status: 'completed' | 'current' | 'upcoming';
  transition?: StageTransition;
  isFirst?: boolean;
  isLast?: boolean;
}

const TimelineStage: React.FC<TimelineStageProps> = ({ 
  stage, 
  status, 
  transition,
  isFirst = false,
  isLast = false 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-500 border-green-500';
      case 'current': return 'bg-blue-500 border-blue-500 animate-pulse';
      case 'upcoming': return 'bg-gray-300 border-gray-300';
    }
  };

  const getLineColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'current': return 'bg-blue-200';
      case 'upcoming': return 'bg-gray-200';
    }
  };

  return (
    <div className="flex items-start">
      <div className="flex flex-col items-center mr-4">
        {/* Circle indicator */}
        <div className={`w-4 h-4 rounded-full border-2 ${getStatusColor()} ${
          status === 'current' ? 'ring-4 ring-blue-100' : ''
        }`}></div>
        
        {/* Connecting line */}
        {!isLast && (
          <div className={`w-0.5 h-24 ${getLineColor()}`}></div>
        )}
      </div>

      <div className="flex-1 pb-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className={`font-semibold ${
              status === 'completed' ? 'text-green-700' :
              status === 'current' ? 'text-blue-700' :
              'text-gray-500'
            }`}>
              {stage.name}
            </h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              status === 'completed' ? 'bg-green-100 text-green-800' :
              status === 'current' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-600'
            }`}>
              {status.toUpperCase()}
            </span>
          </div>

          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Department:</span>
              <span className="font-medium">{stage.department}</span>
            </div>
            
            {stage.estimated_hours && (
              <div className="flex justify-between">
                <span>Est. Duration:</span>
                <span className="font-medium">{stage.estimated_hours} hrs</span>
              </div>
            )}

            {transition && (
              <>
                {transition.transition_date && (
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span className="font-medium">
                      {new Date(transition.transition_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
                
                {transition.duration_hours && (
                  <div className="flex justify-between">
                    <span>Actual Duration:</span>
                    <span className={`font-medium ${
                      transition.duration_hours > (stage.estimated_hours || 0) 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {transition.duration_hours} hrs
                    </span>
                  </div>
                )}

                {transition.transitioned_by_user && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      By: {transition.transitioned_by_user.full_name}
                    </p>
                  </div>
                )}

                {transition.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">{transition.notes}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProductionTimelineProps {
  workflow: ProductionWorkflow;
  onStageComplete?: (stageId: string) => void;
}

export const ProductionTimeline: React.FC<ProductionTimelineProps> = ({ 
  workflow, 
  onStageComplete 
}) => {
  const [stages, setStages] = useState<ProductionStage[]>([]);
  const [transitions, setTransitions] = useState<StageTransition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimelineData();
  }, [workflow.id]);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      const [stagesData, transitionsData] = await Promise.all([
        productionService.getProductionStages(),
        productionService.getStageTransitions(workflow.id),
      ]);
      setStages(stagesData);
      setTransitions(transitionsData);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageStatus = (stage: ProductionStage): 'completed' | 'current' | 'upcoming' => {
    if (!workflow.current_stage_id) return 'upcoming';
    
    const currentStageOrder = stages.find(s => s.id === workflow.current_stage_id)?.stage_order || 0;
    
    if (stage.stage_order < currentStageOrder) return 'completed';
    if (stage.id === workflow.current_stage_id) return 'current';
    return 'upcoming';
  };

  const getTransitionForStage = (stageId: string) => {
    return transitions.find(t => t.to_stage_id === stageId);
  };

  const handleCompleteStage = async () => {
    if (!workflow.current_stage_id) return;

    const currentStage = stages.find(s => s.id === workflow.current_stage_id);
    if (!currentStage) return;

    const nextStage = stages.find(s => s.stage_order === currentStage.stage_order + 1);
    if (!nextStage) return;

    try {
      await productionService.transitionStage({
        workflow_id: workflow.id,
        to_stage_id: nextStage.id,
        notes: 'Stage completed',
      });
      
      onStageComplete?.(nextStage.id);
      fetchTimelineData();
    } catch (error) {
      console.error('Error completing stage:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const currentStage = stages.find(s => s.id === workflow.current_stage_id);
  const completedStages = stages.filter(s => getStageStatus(s) === 'completed').length;
  const progressPercentage = (completedStages / stages.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Production Timeline</h3>
            <p className="text-sm text-gray-600">
              Piece Mark: {workflow.piece_mark?.mark} - {workflow.piece_mark?.description}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Overall Progress</p>
            <p className="text-2xl font-bold text-indigo-600">{Math.round(progressPercentage)}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Current Stage Info */}
        {currentStage && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-900">Current Stage</p>
                <p className="text-lg font-semibold text-blue-700">{currentStage.name}</p>
              </div>
              
              {workflow.status === 'in_progress' && (
                <button
                  onClick={handleCompleteStage}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Complete Stage
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {stages.map((stage, index) => (
          <TimelineStage
            key={stage.id}
            stage={stage}
            status={getStageStatus(stage)}
            transition={getTransitionForStage(stage.id)}
            isFirst={index === 0}
            isLast={index === stages.length - 1}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-sm text-gray-600">Total Stages</p>
          <p className="text-xl font-semibold">{stages.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Completed</p>
          <p className="text-xl font-semibold text-green-600">{completedStages}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Remaining</p>
          <p className="text-xl font-semibold text-orange-600">{stages.length - completedStages}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Status</p>
          <p className={`text-xl font-semibold ${
            workflow.status === 'completed' ? 'text-green-600' :
            workflow.status === 'in_progress' ? 'text-blue-600' :
            workflow.status === 'on_hold' ? 'text-yellow-600' :
            'text-gray-600'
          }`}>
            {workflow.status.replace('_', ' ').toUpperCase()}
          </p>
        </div>
      </div>
    </div>
  );
};