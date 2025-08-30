import { supabase } from '../lib/supabase';
import type {
  ProductionWorkflow,
  ProductionStage,
  ProductionTask,
  StageTransition,
  ProductionIssue,
  ProductionMetrics,
  MaterialConsumption,
  ProductionAttachment,
  CreateWorkflowData,
  UpdateTaskData,
  CreateIssueData,
  StageTransitionData,
  WorkflowStatus,
  ProductionStats,
  WorkflowUpdateEvent,
  TaskUpdateEvent,
} from '../types/production.types';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';

export class ProductionService {
  private workflowChannel: RealtimeChannel | null = null;
  private taskChannel: RealtimeChannel | null = null;

  // ==================== Production Stages ====================
  
  async getProductionStages(): Promise<ProductionStage[]> {
    const { data, error } = await supabase
      .from('production_stages')
      .select('*')
      .eq('is_active', true)
      .order('stage_order');

    if (error) throw error;
    return data || [];
  }

  async getStageById(stageId: string): Promise<ProductionStage | null> {
    const { data, error } = await supabase
      .from('production_stages')
      .select('*')
      .eq('id', stageId)
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== Production Workflow ====================

  async createWorkflow(data: CreateWorkflowData): Promise<ProductionWorkflow> {
    const { data: workflow, error } = await supabase
      .from('production_workflow')
      .insert({
        ...data,
        status: 'not_started',
        progress_percentage: 0,
      })
      .select(`
        *,
        current_stage:production_stages(*),
        piece_mark:piece_marks(mark, description, quantity, weight_each),
        assigned_user:profiles!assigned_to(full_name, email)
      `)
      .single();

    if (error) throw error;

    // Create initial tasks for the workflow
    await this.createInitialTasks(workflow.id);

    return workflow;
  }

  async getWorkflow(workflowId: string): Promise<ProductionWorkflow | null> {
    const { data, error } = await supabase
      .from('production_workflow')
      .select(`
        *,
        current_stage:production_stages(*),
        piece_mark:piece_marks(mark, description, quantity, weight_each),
        assigned_user:profiles!assigned_to(full_name, email)
      `)
      .eq('id', workflowId)
      .single();

    if (error) throw error;
    return data;
  }

  async getProjectWorkflows(projectId: string): Promise<ProductionWorkflow[]> {
    const { data, error } = await supabase
      .from('production_workflow')
      .select(`
        *,
        current_stage:production_stages(*),
        piece_mark:piece_marks(mark, description, quantity, weight_each),
        assigned_user:profiles!assigned_to(full_name, email)
      `)
      .eq('project_id', projectId)
      .order('priority', { ascending: false })
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  async updateWorkflow(
    workflowId: string,
    updates: Partial<ProductionWorkflow>
  ): Promise<ProductionWorkflow> {
    const { data, error } = await supabase
      .from('production_workflow')
      .update(updates)
      .eq('id', workflowId)
      .select(`
        *,
        current_stage:production_stages(*),
        piece_mark:piece_marks(mark, description, quantity, weight_each),
        assigned_user:profiles!assigned_to(full_name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async updateWorkflowStatus(
    workflowId: string,
    status: WorkflowStatus
  ): Promise<ProductionWorkflow> {
    const updates: Partial<ProductionWorkflow> = { status };

    if (status === 'in_progress' && !updates.actual_start) {
      updates.actual_start = new Date().toISOString();
    } else if (status === 'completed') {
      updates.actual_end = new Date().toISOString();
      updates.progress_percentage = 100;
    }

    return this.updateWorkflow(workflowId, updates);
  }

  // ==================== Stage Transitions ====================

  async transitionStage(data: StageTransitionData): Promise<ProductionWorkflow> {
    const workflow = await this.getWorkflow(data.workflow_id);
    if (!workflow) throw new Error('Workflow not found');

    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    // Calculate duration if transitioning from a stage
    let duration_hours: number | undefined;
    if (workflow.current_stage_id) {
      const lastTransition = await this.getLastTransition(data.workflow_id);
      if (lastTransition?.transition_date) {
        const hours = (Date.now() - new Date(lastTransition.transition_date).getTime()) / (1000 * 60 * 60);
        duration_hours = Math.round(hours * 10) / 10;
      }
    }

    // Create transition record
    const { error: transitionError } = await supabase
      .from('stage_transitions')
      .insert({
        workflow_id: data.workflow_id,
        from_stage_id: workflow.current_stage_id,
        to_stage_id: data.to_stage_id,
        transitioned_by: user.data.user.id,
        notes: data.notes,
        duration_hours,
      });

    if (transitionError) throw transitionError;

    // Update workflow
    const toStage = await this.getStageById(data.to_stage_id);
    const stages = await this.getProductionStages();
    const completedStages = stages.filter(s => s.stage_order < (toStage?.stage_order || 0)).length;
    const progress = Math.round((completedStages / stages.length) * 100);

    return this.updateWorkflow(data.workflow_id, {
      current_stage_id: data.to_stage_id,
      progress_percentage: progress,
      status: workflow.status === 'not_started' ? 'in_progress' : workflow.status,
    });
  }

  async getStageTransitions(workflowId: string): Promise<StageTransition[]> {
    const { data, error } = await supabase
      .from('stage_transitions')
      .select(`
        *,
        from_stage:production_stages!from_stage_id(*),
        to_stage:production_stages!to_stage_id(*),
        transitioned_by_user:profiles!transitioned_by(full_name)
      `)
      .eq('workflow_id', workflowId)
      .order('transition_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async getLastTransition(workflowId: string): Promise<StageTransition | null> {
    const { data, error } = await supabase
      .from('stage_transitions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('transition_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ==================== Production Tasks ====================

  async createInitialTasks(workflowId: string): Promise<void> {
    const stages = await this.getProductionStages();
    
    const taskTemplates = [
      { stage: 'Engineering Review', tasks: ['Review drawings', 'Verify specifications'] },
      { stage: 'Material Preparation', tasks: ['Order materials', 'Receive materials', 'Stage materials'] },
      { stage: 'Cutting', tasks: ['Setup cutting equipment', 'Cut to dimensions', 'Quality check cuts'] },
      { stage: 'Welding', tasks: ['Setup welding', 'Perform welds', 'Visual inspection'] },
      { stage: 'Quality Inspection', tasks: ['Dimensional check', 'Weld inspection', 'Document results'] },
      { stage: 'Painting/Galvanizing', tasks: ['Surface preparation', 'Apply coating', 'Final inspection'] },
    ];

    const tasks: Array<Partial<ProductionTask>> = [];
    
    for (const template of taskTemplates) {
      const stage = stages.find(s => s.name === template.stage);
      if (!stage) continue;

      for (const taskName of template.tasks) {
        tasks.push({
          workflow_id: workflowId,
          stage_id: stage.id,
          task_name: taskName,
          task_type: this.getTaskType(taskName),
          status: 'pending',
          estimated_hours: Math.round(Math.random() * 4 + 1),
        });
      }
    }

    if (tasks.length > 0) {
      const { error } = await supabase
        .from('production_tasks')
        .insert(tasks);
      
      if (error) console.error('Error creating initial tasks:', error);
    }
  }

  private getTaskType(taskName: string): string {
    const taskName_lower = taskName.toLowerCase();
    if (taskName_lower.includes('weld')) return 'welding';
    if (taskName_lower.includes('cut')) return 'cutting';
    if (taskName_lower.includes('drill')) return 'drilling';
    if (taskName_lower.includes('paint') || taskName_lower.includes('coat')) return 'painting';
    if (taskName_lower.includes('inspect')) return 'inspection';
    if (taskName_lower.includes('assemb')) return 'assembly';
    if (taskName_lower.includes('ship')) return 'shipping';
    return 'fabrication';
  }

  async getWorkflowTasks(workflowId: string): Promise<ProductionTask[]> {
    const { data, error } = await supabase
      .from('production_tasks')
      .select(`
        *,
        stage:production_stages(*),
        assigned_user:profiles!assigned_to(full_name)
      `)
      .eq('workflow_id', workflowId)
      .order('stage_id')
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  async updateTask(taskId: string, data: UpdateTaskData): Promise<ProductionTask> {
    const updates: Partial<ProductionTask> & { started_at?: string; completed_at?: string } = { ...data };
    
    if (data.status === 'in_progress' && !updates.started_at) {
      updates.started_at = new Date().toISOString();
    } else if (data.status === 'completed' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data: task, error } = await supabase
      .from('production_tasks')
      .update(updates)
      .eq('id', taskId)
      .select(`
        *,
        stage:production_stages(*),
        assigned_user:profiles!assigned_to(full_name)
      `)
      .single();

    if (error) throw error;
    return task;
  }

  async assignTask(taskId: string): Promise<ProductionTask> {
    return this.updateTask(taskId, { 
      status: 'pending',
      actual_hours: undefined,
      notes: `Assigned to user`,
    });
  }

  // ==================== Production Issues ====================

  async createIssue(data: CreateIssueData): Promise<ProductionIssue> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const { data: issue, error } = await supabase
      .from('production_issues')
      .insert({
        ...data,
        reported_by: user.data.user.id,
        status: 'open',
      })
      .select(`
        *,
        reporter:profiles!reported_by(full_name),
        assignee:profiles!assigned_to(full_name)
      `)
      .single();

    if (error) throw error;
    return issue;
  }

  async getWorkflowIssues(workflowId: string): Promise<ProductionIssue[]> {
    const { data, error } = await supabase
      .from('production_issues')
      .select(`
        *,
        reporter:profiles!reported_by(full_name),
        assignee:profiles!assigned_to(full_name)
      `)
      .eq('workflow_id', workflowId)
      .order('reported_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async updateIssueStatus(
    issueId: string,
    status: 'open' | 'in_progress' | 'resolved' | 'closed',
    resolution?: string
  ): Promise<ProductionIssue> {
    const updates: Partial<ProductionIssue> & { resolution?: string; resolved_at?: string } = { status };
    
    if (resolution) {
      updates.resolution = resolution;
    }
    
    if (status === 'resolved' || status === 'closed') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('production_issues')
      .update(updates)
      .eq('id', issueId)
      .select(`
        *,
        reporter:profiles!reported_by(full_name),
        assignee:profiles!assigned_to(full_name)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== Production Metrics ====================

  async recordMetrics(workflowId: string, metrics: Partial<ProductionMetrics>): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('production_metrics')
      .upsert({
        workflow_id: workflowId,
        metric_date: today,
        ...metrics,
      }, {
        onConflict: 'workflow_id,metric_date',
      });

    if (error) throw error;
  }

  async getWorkflowMetrics(workflowId: string, days: number = 30): Promise<ProductionMetrics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('production_metrics')
      .select('*')
      .eq('workflow_id', workflowId)
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date');

    if (error) throw error;
    return data || [];
  }

  // ==================== Statistics & Dashboard ====================

  async getProductionStats(projectId: string): Promise<ProductionStats> {
    const workflows = await this.getProjectWorkflows(projectId);
    
    const stats: ProductionStats = {
      total_pieces: workflows.length,
      in_progress: workflows.filter(w => w.status === 'in_progress').length,
      completed: workflows.filter(w => w.status === 'completed').length,
      on_hold: workflows.filter(w => w.status === 'on_hold').length,
      completion_rate: 0,
      average_cycle_time: 0,
      efficiency_rate: 0,
      issues_open: 0,
    };

    if (stats.total_pieces > 0) {
      stats.completion_rate = (stats.completed / stats.total_pieces) * 100;
    }

    // Calculate average cycle time for completed workflows
    const completedWorkflows = workflows.filter(w => 
      w.status === 'completed' && w.actual_start && w.actual_end
    );
    
    if (completedWorkflows.length > 0) {
      const totalHours = completedWorkflows.reduce((sum, w) => {
        const start = new Date(w.actual_start!).getTime();
        const end = new Date(w.actual_end!).getTime();
        return sum + (end - start) / (1000 * 60 * 60);
      }, 0);
      stats.average_cycle_time = totalHours / completedWorkflows.length;
    }

    // Get open issues count
    const { count } = await supabase
      .from('production_issues')
      .select('*', { count: 'exact', head: true })
      .in('workflow_id', workflows.map(w => w.id))
      .in('status', ['open', 'in_progress']);
    
    stats.issues_open = count || 0;

    return stats;
  }

  // ==================== Real-time Subscriptions ====================

  subscribeToWorkflowUpdates(
    projectId: string,
    onUpdate: (event: WorkflowUpdateEvent) => void
  ): () => void {
    // Clean up existing subscription
    if (this.workflowChannel) {
      supabase.removeChannel(this.workflowChannel);
    }

    this.workflowChannel = supabase
      .channel(`production_workflow:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_workflow',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: RealtimePostgresChangesPayload<ProductionWorkflow>) => {
          const event: WorkflowUpdateEvent = {
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            workflow_id: payload.new?.id || payload.old?.id || '',
            changes: payload.new as Partial<ProductionWorkflow>,
            timestamp: new Date().toISOString(),
          };
          onUpdate(event);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      if (this.workflowChannel) {
        supabase.removeChannel(this.workflowChannel);
        this.workflowChannel = null;
      }
    };
  }

  subscribeToTaskUpdates(
    workflowId: string,
    onUpdate: (event: TaskUpdateEvent) => void
  ): () => void {
    // Clean up existing subscription
    if (this.taskChannel) {
      supabase.removeChannel(this.taskChannel);
    }

    this.taskChannel = supabase
      .channel(`production_tasks:${workflowId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'production_tasks',
          filter: `workflow_id=eq.${workflowId}`,
        },
        (payload: RealtimePostgresChangesPayload<ProductionTask>) => {
          const event: TaskUpdateEvent = {
            type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
            task_id: payload.new?.id || payload.old?.id || '',
            workflow_id: workflowId,
            changes: payload.new as Partial<ProductionTask>,
            timestamp: new Date().toISOString(),
          };
          onUpdate(event);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      if (this.taskChannel) {
        supabase.removeChannel(this.taskChannel);
        this.taskChannel = null;
      }
    };
  }

  // ==================== Material & Attachments ====================

  async recordMaterialConsumption(
    workflowId: string,
    material: Omit<MaterialConsumption, 'id' | 'workflow_id' | 'created_at'>
  ): Promise<void> {
    const { error } = await supabase
      .from('material_consumption')
      .insert({
        workflow_id: workflowId,
        ...material,
        consumed_date: new Date().toISOString().split('T')[0],
      });

    if (error) throw error;
  }

  async uploadAttachment(
    workflowId: string,
    file: File,
    type: 'drawing' | 'photo' | 'report' | 'certificate' | 'other',
    description?: string
  ): Promise<ProductionAttachment> {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('User not authenticated');

    const fileName = `production/${workflowId}/${Date.now()}-${file.name}`;
    
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('production-attachments')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('production-attachments')
      .getPublicUrl(fileName);

    // Save to database
    const { data, error } = await supabase
      .from('production_attachments')
      .insert({
        workflow_id: workflowId,
        attachment_type: type,
        file_url: publicUrl,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: user.data.user.id,
        description,
      })
      .select(`
        *,
        uploader:profiles!uploaded_by(full_name)
      `)
      .single();

    if (error) throw error;
    return data;
  }
}

export const productionService = new ProductionService();