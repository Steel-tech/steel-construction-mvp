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