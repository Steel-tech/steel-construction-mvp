import React, { useState, useEffect } from 'react';
import { DndContext, type DragEndEvent, type DragStartEvent, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import type { ProductionWorkflow, ProductionStage, Priority } from '../../types/production.types';
import { productionService } from '../../services/production.service';

interface KanbanColumnProps {
  stage: ProductionStage;
  workflows: ProductionWorkflow[];
  onWorkflowMove?: (workflowId: string, toStageId: string) => void;
}

interface DraggableCardProps {
  workflow: ProductionWorkflow;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ workflow }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: workflow.id,
    data: workflow,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'normal': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-400 bg-gray-50';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`border-2 rounded-lg p-3 cursor-move transition-all hover:shadow-lg ${getPriorityColor(workflow.priority)}`}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-900">{workflow.piece_mark?.mark}</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          workflow.priority === 'urgent' ? 'bg-red-200 text-red-800' :
          workflow.priority === 'high' ? 'bg-orange-200 text-orange-800' :
          workflow.priority === 'normal' ? 'bg-blue-200 text-blue-800' :
          'bg-gray-200 text-gray-800'
        }`}>
          {workflow.priority.toUpperCase()}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
        {workflow.piece_mark?.description}
      </p>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Quantity:</span>
          <span className="font-medium">{workflow.piece_mark?.quantity || 0}</span>
        </div>
        
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-500">Weight:</span>
          <span className="font-medium">{workflow.piece_mark?.weight_each?.toLocaleString() || 0} lbs</span>
        </div>

        {workflow.assigned_user && (
          <div className="flex items-center text-xs">
            <span className="text-gray-500 mr-1">Assigned:</span>
            <span className="font-medium truncate">{workflow.assigned_user.full_name}</span>
          </div>
        )}

        <div className="w-full">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-gray-500">Progress:</span>
            <span className="font-medium">{workflow.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all ${getProgressColor(workflow.progress_percentage)}`}
              style={{ width: `${workflow.progress_percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const KanbanColumn: React.FC<KanbanColumnProps> = ({ stage, workflows }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'engineering': return 'bg-purple-100 text-purple-800';
      case 'shop': return 'bg-blue-100 text-blue-800';
      case 'paint': return 'bg-green-100 text-green-800';
      case 'shipping': return 'bg-yellow-100 text-yellow-800';
      case 'field': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalWeight = workflows.reduce((sum, w) => sum + (w.piece_mark?.weight_each || 0) * (w.piece_mark?.quantity || 0), 0);

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col bg-gray-50 rounded-lg p-4 min-h-[600px] transition-all ${
        isOver ? 'bg-blue-50 ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(stage.department)}`}>
            {stage.department}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>{workflows.length} items</span>
          <span>{(totalWeight / 1000).toFixed(1)} tons</span>
        </div>
        
        {stage.estimated_hours && (
          <div className="text-xs text-gray-500 mt-1">
            Est. {stage.estimated_hours} hrs
          </div>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto">
        {workflows.map(workflow => (
          <DraggableCard key={workflow.id} workflow={workflow} />
        ))}
      </div>

      {workflows.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Drop items here</p>
        </div>
      )}
    </div>
  );
};

interface ProductionKanbanProps {
  projectId: string;
  onWorkflowUpdate?: (workflow: ProductionWorkflow) => void;
}

export const ProductionKanban: React.FC<ProductionKanbanProps> = ({ 
  projectId, 
  onWorkflowUpdate 
}) => {
  const [stages, setStages] = useState<ProductionStage[]>([]);
  const [workflows, setWorkflows] = useState<ProductionWorkflow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stagesData, workflowsData] = await Promise.all([
        productionService.getProductionStages(),
        productionService.getProjectWorkflows(projectId),
      ]);
      setStages(stagesData);
      setWorkflows(workflowsData);
    } catch (error) {
      console.error('Error fetching kanban data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const workflowId = active.id as string;
    const toStageId = over.id as string;

    // Optimistically update UI
    setWorkflows(prev => prev.map(w => 
      w.id === workflowId 
        ? { ...w, current_stage_id: toStageId }
        : w
    ));

    try {
      const updatedWorkflow = await productionService.transitionStage({
        workflow_id: workflowId,
        to_stage_id: toStageId,
        notes: 'Moved via Kanban board',
      });
      
      onWorkflowUpdate?.(updatedWorkflow);
    } catch (error) {
      console.error('Error updating workflow:', error);
      // Revert on error
      fetchData();
    }
  };

  const getWorkflowsByStage = (stageId: string) => {
    return workflows.filter(w => w.current_stage_id === stageId);
  };

  const activeWorkflow = activeId ? workflows.find(w => w.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {stages.map(stage => (
            <div key={stage.id} className="w-80 flex-shrink-0">
              <KanbanColumn
                stage={stage}
                workflows={getWorkflowsByStage(stage.id)}
                onWorkflowMove={() => {}}
              />
            </div>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeWorkflow && (
          <div className="bg-white shadow-xl rounded-lg p-3 opacity-90 cursor-move">
            <h4 className="font-semibold">{activeWorkflow.piece_mark?.mark}</h4>
            <p className="text-sm text-gray-600">{activeWorkflow.piece_mark?.description}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};