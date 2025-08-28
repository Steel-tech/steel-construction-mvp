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
        Row: PieceMark;
        Insert: Omit<PieceMark, 'id' | 'created_at' | 'updated_at' | 'total_weight'>;
        Update: Partial<Omit<PieceMark, 'id' | 'created_at' | 'updated_at' | 'total_weight'>>;
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
    };
  };
}