export type UserRole = 'admin' | 'project_manager' | 'shop' | 'field' | 'client';

export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold';

export type PieceMarkStatus = 'not_started' | 'fabricating' | 'completed' | 'shipped' | 'installed';

export type WorkOrderType = 'fabrication' | 'installation' | 'inspection' | 'repair';

export type WorkOrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  company?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  project_number: string;
  name: string;
  description?: string;
  client_id?: string;
  project_manager_id?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface PieceMark {
  id: string;
  project_id: string;
  mark: string;
  description?: string;
  quantity: number;
  weight_per_piece?: number;
  total_weight?: number;
  material_type?: string;
  status: PieceMarkStatus;
  shop_assigned_to?: string;
  field_assigned_to?: string;
  drawing_number?: string;
  sequence_number?: number;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  project_id: string;
  work_order_number: string;
  title: string;
  description?: string;
  type: WorkOrderType;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assigned_to?: string;
  due_date?: string;
  completed_date?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderPieceMark {
  id: string;
  work_order_id: string;
  piece_mark_id: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'completed';
  completed_at?: string;
  notes?: string;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  project_id: string;
  work_order_id?: string;
  piece_mark_id?: string;
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
  uploaded_by: string;
  taken_at?: string;
  created_at: string;
}

// Import field types
export type DeliveryStatus = 'pending' | 'in_transit' | 'delivered' | 'received' | 'rejected';
export type PieceLocation = 'yard' | 'staging' | 'crane_zone' | 'installed' | 'unknown';

export interface Delivery {
  id: string;
  project_id: string;
  delivery_number: string;
  truck_number?: string;
  driver_name?: string;
  scheduled_date: string;
  actual_date?: string;
  status: DeliveryStatus;
  notes?: string;
  received_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DeliveryItem {
  id: string;
  delivery_id: string;
  piece_mark_id: string;
  quantity: number;
  received_quantity?: number;
  location?: PieceLocation;
  condition?: 'good' | 'damaged' | 'missing';
  notes?: string;
  created_at: string;
}

export interface CrewAssignment {
  id: string;
  project_id: string;
  crew_name: string;
  foreman_id: string;
  crew_size: number;
  zone?: string;
  shift: 'day' | 'night' | 'weekend';
  date: string;
  piece_marks?: string[];
  status: 'scheduled' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface FieldActivity {
  id: string;
  project_id: string;
  piece_mark_id?: string;
  activity_type: 'received' | 'moved' | 'installed' | 'inspection' | 'issue';
  description: string;
  location?: PieceLocation;
  crew_id?: string;
  user_id: string;
  photos?: string[];
  created_at: string;
}

// Production types - need to be defined here for Database
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

// Quality types
export type InspectionType = 'welding' | 'dimensional' | 'coating' | 'bolting' | 'general' | 'final';
export type InspectionStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'conditional';
export type InspectionResult = 'pass' | 'fail' | 'conditional_pass' | 'needs_reinspection';
export type ItemResult = 'pass' | 'fail' | 'na' | 'conditional';
export type Severity = 'critical' | 'major' | 'minor' | 'observation';
export type NCRStatus = 'open' | 'in_review' | 'approved' | 'rejected' | 'closed';
export type PhotoType = 'before' | 'during' | 'after' | 'defect' | 'repair' | 'final';
export type WeldType = 'fillet' | 'groove' | 'plug' | 'slot' | 'spot' | 'seam';
export type WeldPosition = '1F' | '2F' | '3F' | '4F' | '1G' | '2G' | '3G' | '4G' | '5G' | '6G';
export type PorosityLevel = 'none' | 'minor' | 'moderate' | 'excessive';
export type SpatterLevel = 'none' | 'light' | 'moderate' | 'heavy';

// Minimal interfaces for Database - only what's needed for Supabase operations
interface ProductionStage {
  id: string;
  name: string;
  stage_order: number;
  department: Department;
  required_approvals: number;
  estimated_hours?: number;
  is_active: boolean;
  created_at: string;
}

interface ProductionWorkflow {
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
}

interface ProductionTask {
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
}

interface ProductionIssue {
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
}

interface StageTransition {
  id: string;
  workflow_id: string;
  from_stage_id?: string;
  to_stage_id?: string;
  transitioned_by: string;
  transition_date: string;
  notes?: string;
  duration_hours?: number;
}

interface ProductionMetrics {
  id: string;
  workflow_id: string;
  metric_date: string;
  pieces_completed?: number;
  weight_completed?: number;
  man_hours?: number;
  machine_hours?: number;
  efficiency_rate?: number;
  defect_rate?: number;
  rework_hours?: number;
  created_at: string;
}

interface MaterialConsumption {
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

interface ProductionAttachment {
  id: string;
  workflow_id: string;
  attachment_type: AttachmentType;
  file_url: string;
  file_name: string;
  file_size?: number;
  uploaded_by: string;
  description?: string;
  created_at: string;
}

// Quality interfaces
interface QualityInspection {
  id: string;
  piece_mark_id: string;
  project_id: string;
  template_id?: string;
  inspection_type: InspectionType;
  inspector_id: string;
  inspection_date: string;
  status: InspectionStatus;
  overall_result?: InspectionResult;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface InspectionItem {
  id: string;
  inspection_id: string;
  item_name: string;
  category: string;
  specification?: string;
  measured_value?: string;
  tolerance_min?: number;
  tolerance_max?: number;
  actual_value?: number;
  result: ItemResult;
  comments?: string;
  severity: Severity;
  created_at: string;
}

interface WeldingInspection {
  id: string;
  inspection_id: string;
  weld_type?: WeldType;
  weld_position?: WeldPosition;
  electrode_type?: string;
  welder_id?: string;
  wps_number?: string;
  visual_inspection?: ItemResult;
  penetration_test?: ItemResult;
  magnetic_particle?: ItemResult;
  ultrasonic_test?: ItemResult;
  radiographic_test?: ItemResult;
  weld_size_required?: number;
  weld_size_actual?: number;
  undercut_depth?: number;
  porosity_level?: PorosityLevel;
  cracks_found?: boolean;
  incomplete_fusion?: boolean;
  spatter_level?: SpatterLevel;
  created_at: string;
}

interface DimensionalCheck {
  id: string;
  inspection_id: string;
  dimension_type: string;
  nominal_value: number;
  tolerance_plus?: number;
  tolerance_minus?: number;
  actual_value: number;
  unit: 'mm' | 'inch' | 'ft' | 'm';
  measurement_tool?: string;
  result: 'pass' | 'fail' | 'marginal';
  deviation?: number;
  created_at: string;
}

interface NCRReport {
  id: string;
  ncr_number: string;
  inspection_id?: string;
  piece_mark_id?: string;
  project_id: string;
  reported_by: string;
  assigned_to?: string;
  description: string;
  root_cause?: string;
  corrective_action?: string;
  preventive_action?: string;
  severity: 'critical' | 'major' | 'minor';
  status: NCRStatus;
  due_date?: string;
  closed_date?: string;
  cost_impact?: number;
  time_impact_hours?: number;
  created_at: string;
  updated_at: string;
}

interface InspectionPhoto {
  id: string;
  inspection_id?: string;
  inspection_item_id?: string;
  ncr_id?: string;
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
  photo_type?: PhotoType;
  annotated_url?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>;
      };
      piece_marks: {
        Row: PieceMark & { field_location?: PieceLocation };
        Insert: Omit<PieceMark, 'id' | 'created_at' | 'updated_at' | 'total_weight'>;
        Update: Partial<Omit<PieceMark, 'id' | 'created_at' | 'updated_at' | 'total_weight'>> & { field_location?: PieceLocation };
      };
      work_orders: {
        Row: WorkOrder;
        Insert: Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<WorkOrder, 'id' | 'created_at' | 'updated_at'>>;
      };
      work_order_piece_marks: {
        Row: WorkOrderPieceMark;
        Insert: Omit<WorkOrderPieceMark, 'id' | 'created_at'>;
        Update: Partial<Omit<WorkOrderPieceMark, 'id' | 'created_at'>>;
      };
      progress_photos: {
        Row: ProgressPhoto;
        Insert: Omit<ProgressPhoto, 'id' | 'created_at'>;
        Update: Partial<Omit<ProgressPhoto, 'id' | 'created_at'>>;
      };
      deliveries: {
        Row: Delivery;
        Insert: Omit<Delivery, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Delivery, 'id' | 'created_at' | 'updated_at'>>;
      };
      delivery_items: {
        Row: DeliveryItem;
        Insert: Omit<DeliveryItem, 'id' | 'created_at'>;
        Update: Partial<Omit<DeliveryItem, 'id' | 'created_at'>>;
      };
      crew_assignments: {
        Row: CrewAssignment;
        Insert: Omit<CrewAssignment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<CrewAssignment, 'id' | 'created_at' | 'updated_at'>>;
      };
      field_activities: {
        Row: FieldActivity;
        Insert: Omit<FieldActivity, 'id' | 'created_at'>;
        Update: Partial<Omit<FieldActivity, 'id' | 'created_at'>>;
      };
      production_workflow: {
        Row: ProductionWorkflow;
        Insert: Omit<ProductionWorkflow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ProductionWorkflow, 'id' | 'created_at' | 'updated_at'>>;
      };
      production_stages: {
        Row: ProductionStage;
        Insert: Omit<ProductionStage, 'id' | 'created_at'>;
        Update: Partial<Omit<ProductionStage, 'id' | 'created_at'>>;
      };
      production_tasks: {
        Row: ProductionTask;
        Insert: Omit<ProductionTask, 'id' | 'created_at'>;
        Update: Partial<Omit<ProductionTask, 'id' | 'created_at'>>;
      };
      stage_transitions: {
        Row: StageTransition;
        Insert: Omit<StageTransition, 'id' | 'transition_date'>;
        Update: Partial<Omit<StageTransition, 'id' | 'transition_date'>>;
      };
      production_issues: {
        Row: ProductionIssue;
        Insert: Omit<ProductionIssue, 'id' | 'reported_at'>;
        Update: Partial<Omit<ProductionIssue, 'id' | 'reported_at'>>;
      };
      production_metrics: {
        Row: ProductionMetrics;
        Insert: Omit<ProductionMetrics, 'id' | 'created_at'>;
        Update: Partial<Omit<ProductionMetrics, 'id' | 'created_at'>>;
      };
      material_consumption: {
        Row: MaterialConsumption;
        Insert: Omit<MaterialConsumption, 'id' | 'created_at'>;
        Update: Partial<Omit<MaterialConsumption, 'id' | 'created_at'>>;
      };
      production_attachments: {
        Row: ProductionAttachment;
        Insert: Omit<ProductionAttachment, 'id' | 'created_at'>;
        Update: Partial<Omit<ProductionAttachment, 'id' | 'created_at'>>;
      };
      quality_inspections: {
        Row: QualityInspection;
        Insert: Omit<QualityInspection, 'id' | 'created_at' | 'updated_at' | 'inspection_date'>;
        Update: Partial<Omit<QualityInspection, 'id' | 'created_at' | 'updated_at' | 'inspection_date'>>;
      };
      inspection_items: {
        Row: InspectionItem;
        Insert: Omit<InspectionItem, 'id' | 'created_at'>;
        Update: Partial<Omit<InspectionItem, 'id' | 'created_at'>>;
      };
      welding_inspections: {
        Row: WeldingInspection;
        Insert: Omit<WeldingInspection, 'id' | 'created_at'>;
        Update: Partial<Omit<WeldingInspection, 'id' | 'created_at'>>;
      };
      dimensional_checks: {
        Row: DimensionalCheck;
        Insert: Omit<DimensionalCheck, 'id' | 'created_at' | 'deviation'>;
        Update: Partial<Omit<DimensionalCheck, 'id' | 'created_at' | 'deviation'>>;
      };
      ncr_reports: {
        Row: NCRReport;
        Insert: Omit<NCRReport, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<NCRReport, 'id' | 'created_at' | 'updated_at'>>;
      };
      inspection_photos: {
        Row: InspectionPhoto;
        Insert: Omit<InspectionPhoto, 'id' | 'created_at'>;
        Update: Partial<Omit<InspectionPhoto, 'id' | 'created_at'>>;
      };
    };
  };
}
