export type InspectionType = 'welding' | 'dimensional' | 'coating' | 'bolting' | 'general' | 'final';
export type InspectionStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'conditional';
export type InspectionResult = 'pass' | 'fail' | 'conditional_pass' | 'needs_reinspection';
export type ItemResult = 'pass' | 'fail' | 'na' | 'conditional';
export type Severity = 'critical' | 'major' | 'minor' | 'observation';
export type NCRStatus = 'open' | 'in_review' | 'approved' | 'rejected' | 'closed';
export type PhotoType = 'before' | 'during' | 'after' | 'defect' | 'repair' | 'final';

// Welding specific types
export type WeldType = 'fillet' | 'groove' | 'plug' | 'slot' | 'spot' | 'seam';
export type WeldPosition = '1F' | '2F' | '3F' | '4F' | '1G' | '2G' | '3G' | '4G' | '5G' | '6G';
export type PorosityLevel = 'none' | 'minor' | 'moderate' | 'excessive';
export type SpatterLevel = 'none' | 'light' | 'moderate' | 'heavy';

export interface ChecklistItem {
  name: string;
  criteria: string;
  required: boolean;
}

export interface ChecklistCategory {
  category: string;
  items: ChecklistItem[];
}

export interface QualityChecklistTemplate {
  id: string;
  name: string;
  type: InspectionType;
  description?: string;
  checklist_items: ChecklistCategory[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QualityInspection {
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

export interface InspectionItem {
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

export interface WeldingInspection {
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
  cracks_found: boolean;
  incomplete_fusion: boolean;
  spatter_level?: SpatterLevel;
  created_at: string;
}

export interface DimensionalCheck {
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

export interface NCRReport {
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

export interface InspectionPhoto {
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

export interface QualityCertificate {
  id: string;
  certificate_number: string;
  project_id: string;
  piece_mark_id?: string;
  inspection_id?: string;
  certificate_type: 'material' | 'welding' | 'coating' | 'dimensional' | 'final';
  issued_date: string;
  issued_by: string;
  approved_by?: string;
  document_url?: string;
  status: 'draft' | 'issued' | 'void';
  created_at: string;
}

// Form data interfaces for creating inspections
export interface WeldingInspectionFormData {
  weld_type: WeldType;
  weld_position: WeldPosition;
  electrode_type: string;
  welder_id: string;
  wps_number: string;
  visual_checks: {
    profile: ItemResult;
    size: ItemResult;
    undercut: ItemResult;
    overlap: ItemResult;
    cracks: ItemResult;
    porosity: ItemResult;
    spatter: ItemResult;
  };
  measurements: {
    weld_size_required: number;
    weld_size_actual: number;
    undercut_depth?: number;
  };
  testing: {
    penetration_test?: ItemResult;
    magnetic_particle?: ItemResult;
    ultrasonic_test?: ItemResult;
    radiographic_test?: ItemResult;
  };
}

export interface DimensionalCheckFormData {
  overall_dimensions: {
    length: { nominal: number; actual: number; tolerance: number };
    width: { nominal: number; actual: number; tolerance: number };
    height: { nominal: number; actual: number; tolerance: number };
    diagonal?: { nominal: number; actual: number; tolerance: number };
  };
  hole_patterns?: {
    diameter: { nominal: number; actual: number; tolerance: number };
    spacing: { nominal: number; actual: number; tolerance: number };
    edge_distance: { nominal: number; actual: number; tolerance: number };
  };
  straightness?: {
    camber?: { nominal: number; actual: number; tolerance: number };
    sweep?: { nominal: number; actual: number; tolerance: number };
    twist?: { nominal: number; actual: number; tolerance: number };
  };
}

export interface InspectionSummary {
  total_items: number;
  passed: number;
  failed: number;
  conditional: number;
  na: number;
  pass_rate: number;
  critical_issues: number;
  major_issues: number;
  minor_issues: number;
}