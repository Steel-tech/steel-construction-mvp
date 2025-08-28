// Production Workflow Types

export type WorkflowStatus = 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type Department = 'engineering' | 'shop' | 'paint' | 'shipping' | 'field';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
export type TaskType = 'fabrication' | 'welding' | 'drilling' | 'cutting' | 'assembly' | 'painting' | 'inspection' | 'shipping';
export type IssueType = 'material' | 'equipment' | 'labor' | 'quality' | 'design' | 'weather' | 'other';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type ApprovalType = 'stage_completion' | 'quality_check' | 'shipment_release' | 'final_inspection';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'conditional';
export type AttachmentType = 'drawing' | 'photo' | 'report' | 'certificate' | 'other';

export interface ProductionStage {
  id: string;
  name: string;
  stage_order: number;
  department: Department;
  required_approvals: number;
  estimated_hours?: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductionWorkflow {
  id: string;
  piece_mark_id: string;
  project_id: string;
  current_stage_id?: string;
  status: WorkflowStatus;
  priority: Priority;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  progress_percentage: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  // Relations
  current_stage?: ProductionStage;
  piece_mark?: {
    mark: string;
    description: string;
    quantity: number;
    weight_each: number;
  };
  assigned_user?: {
    full_name: string;
    email: string;
  };
}

export interface StageTransition {
  id: string;
  workflow_id: string;
  from_stage_id?: string;
  to_stage_id?: string;
  transitioned_by: string;
  transition_date: string;
  notes?: string;
  duration_hours?: number;
  // Relations
  from_stage?: ProductionStage;
  to_stage?: ProductionStage;
  transitioned_by_user?: {
    full_name: string;
  };
}

export interface ProductionTask {
  id: string;
  workflow_id: string;
  stage_id: string;
  task_name: string;
  task_type: TaskType;
  status: TaskStatus;
  assigned_to?: string;
  started_at?: string;
  completed_at?: string;
  estimated_hours?: number;
  actual_hours?: number;
  notes?: string;
  created_at: string;
  // Relations
  stage?: ProductionStage;
  assigned_user?: {
    full_name: string;
  };
}

export interface ProductionMetrics {
  id: string;
  workflow_id: string;
  metric_date: string;
  pieces_completed: number;
  weight_completed: number;
  man_hours: number;
  machine_hours: number;
  efficiency_rate?: number;
  defect_rate?: number;
  rework_hours: number;
  created_at: string;
}

export interface ProductionIssue {
  id: string;
  workflow_id: string;
  issue_type: IssueType;
  severity: IssueSeverity;
  description: string;
  impact_hours?: number;
  reported_by: string;
  assigned_to?: string;
  status: IssueStatus;
  resolution?: string;
  reported_at: string;
  resolved_at?: string;
  // Relations
  reporter?: {
    full_name: string;
  };
  assignee?: {
    full_name: string;
  };
}

export interface ProductionApproval {
  id: string;
  workflow_id: string;
  stage_id: string;
  approval_type: ApprovalType;
  approved_by?: string;
  approval_status: ApprovalStatus;
  approval_date?: string;
  comments?: string;
  created_at: string;
  // Relations
  stage?: ProductionStage;
  approver?: {
    full_name: string;
  };
}

export interface MaterialConsumption {
  id: string;
  workflow_id: string;
  material_type: string;
  planned_quantity: number;
  actual_quantity?: number;
  unit: string;
  waste_percentage?: number;
  cost_per_unit?: number;
  total_cost?: number;
  consumed_date?: string;
  created_at: string;
}

export interface ProductionAttachment {
  id: string;
  workflow_id: string;
  attachment_type: AttachmentType;
  file_url: string;
  file_name: string;
  file_size?: number;
  uploaded_by: string;
  description?: string;
  created_at: string;
  // Relations
  uploader?: {
    full_name: string;
  };
}

// Dashboard Statistics
export interface ProductionStats {
  total_pieces: number;
  in_progress: number;
  completed: number;
  on_hold: number;
  completion_rate: number;
  average_cycle_time: number;
  efficiency_rate: number;
  issues_open: number;
}

// Timeline View
export interface ProductionTimeline {
  workflow_id: string;
  piece_mark: string;
  stages: Array<{
    stage_id: string;
    stage_name: string;
    status: 'completed' | 'current' | 'upcoming';
    started_at?: string;
    completed_at?: string;
    duration_hours?: number;
  }>;
  progress: number;
}

// Kanban Board View
export interface KanbanColumn {
  stage_id: string;
  stage_name: string;
  department: Department;
  items: Array<{
    workflow_id: string;
    piece_mark: string;
    description: string;
    priority: Priority;
    assigned_to?: string;
    progress: number;
    days_in_stage: number;
  }>;
  wip_limit?: number;
  total_weight: number;
}

// Form Data Interfaces
export interface CreateWorkflowData {
  piece_mark_id: string;
  project_id: string;
  priority: Priority;
  scheduled_start?: string;
  scheduled_end?: string;
  assigned_to?: string;
}

export interface UpdateTaskData {
  status: TaskStatus;
  actual_hours?: number;
  notes?: string;
  completed_at?: string;
}

export interface CreateIssueData {
  workflow_id: string;
  issue_type: IssueType;
  severity: IssueSeverity;
  description: string;
  impact_hours?: number;
  assigned_to?: string;
}

export interface StageTransitionData {
  workflow_id: string;
  to_stage_id: string;
  notes?: string;
}

// Real-time Subscription Events
export interface WorkflowUpdateEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  workflow_id: string;
  changes?: Partial<ProductionWorkflow>;
  timestamp: string;
}

export interface TaskUpdateEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  task_id: string;
  workflow_id: string;
  changes?: Partial<ProductionTask>;
  timestamp: string;
}