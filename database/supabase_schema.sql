-- Supabase Schema for Steel Construction MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'project_manager', 'shop', 'field', 'client');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'client',
    company TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    client_id UUID REFERENCES public.profiles(id),
    project_manager_id UUID REFERENCES public.profiles(id),
    status TEXT CHECK(status IN ('planning', 'active', 'completed', 'on_hold')) DEFAULT 'planning',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Piece marks table (for tracking steel pieces)
CREATE TABLE public.piece_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    mark TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    weight_per_piece DECIMAL(10,2),
    total_weight DECIMAL(12,2) GENERATED ALWAYS AS (quantity * weight_per_piece) STORED,
    material_type TEXT,
    status TEXT CHECK(status IN ('not_started', 'fabricating', 'completed', 'shipped', 'installed')) DEFAULT 'not_started',
    shop_assigned_to UUID REFERENCES public.profiles(id),
    field_assigned_to UUID REFERENCES public.profiles(id),
    drawing_number TEXT,
    sequence_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, mark)
);

-- Work orders table
CREATE TABLE public.work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    work_order_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('fabrication', 'installation', 'inspection', 'repair')) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    assigned_to UUID REFERENCES public.profiles(id),
    due_date DATE,
    completed_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work order piece marks junction table
CREATE TABLE public.work_order_piece_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES public.work_orders(id) ON DELETE CASCADE,
    piece_mark_id UUID NOT NULL REFERENCES public.piece_marks(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(work_order_id, piece_mark_id)
);

-- Progress photos table
CREATE TABLE public.progress_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES public.work_orders(id) ON DELETE SET NULL,
    piece_mark_id UUID REFERENCES public.piece_marks(id) ON DELETE SET NULL,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    taken_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_projects_manager ON public.projects(project_manager_id);
CREATE INDEX idx_projects_status ON public.projects(status);

CREATE INDEX idx_piece_marks_project ON public.piece_marks(project_id);
CREATE INDEX idx_piece_marks_status ON public.piece_marks(status);
CREATE INDEX idx_piece_marks_shop ON public.piece_marks(shop_assigned_to);
CREATE INDEX idx_piece_marks_field ON public.piece_marks(field_assigned_to);

CREATE INDEX idx_work_orders_project ON public.work_orders(project_id);
CREATE INDEX idx_work_orders_assigned ON public.work_orders(assigned_to);
CREATE INDEX idx_work_orders_status ON public.work_orders(status);

CREATE INDEX idx_activity_log_user ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.piece_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_order_piece_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Projects viewable by authenticated users" ON public.projects
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and PMs can create projects" ON public.projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'project_manager')
        )
    );

CREATE POLICY "Admins and assigned PMs can update projects" ON public.projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND (role = 'admin' OR (role = 'project_manager' AND projects.project_manager_id = auth.uid()))
        )
    );

-- Piece marks policies
CREATE POLICY "Piece marks viewable by authenticated users" ON public.piece_marks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Shop and field users can update assigned piece marks" ON public.piece_marks
    FOR UPDATE USING (
        auth.uid() = shop_assigned_to OR 
        auth.uid() = field_assigned_to OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'project_manager')
        )
    );

-- Work orders policies
CREATE POLICY "Work orders viewable by authenticated users" ON public.work_orders
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Assigned users can update work orders" ON public.work_orders
    FOR UPDATE USING (
        auth.uid() = assigned_to OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'project_manager')
        )
    );

-- Progress photos policies
CREATE POLICY "Photos viewable by authenticated users" ON public.progress_photos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload photos" ON public.progress_photos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Activity log policies (read-only for non-admins)
CREATE POLICY "Activity log viewable by admins" ON public.activity_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Functions and triggers

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_piece_marks_updated_at BEFORE UPDATE ON public.piece_marks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON public.work_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        new.id, 
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
        COALESCE((new.raw_user_meta_data->>'role')::user_role, 'client')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Field Operations Tables

-- Deliveries table
CREATE TABLE public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    delivery_number TEXT UNIQUE NOT NULL,
    truck_number TEXT,
    driver_name TEXT,
    scheduled_date DATE NOT NULL,
    actual_date DATE,
    status TEXT CHECK(status IN ('pending', 'in_transit', 'delivered', 'received', 'rejected')) DEFAULT 'pending',
    notes TEXT,
    received_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery items table
CREATE TABLE public.delivery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    piece_mark_id UUID NOT NULL REFERENCES public.piece_marks(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    received_quantity INTEGER,
    location TEXT CHECK(location IN ('yard', 'staging', 'crane_zone', 'installed', 'unknown')),
    condition TEXT CHECK(condition IN ('good', 'damaged', 'missing')) DEFAULT 'good',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crew assignments table
CREATE TABLE public.crew_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    crew_name TEXT NOT NULL,
    foreman_id UUID NOT NULL REFERENCES public.profiles(id),
    crew_size INTEGER NOT NULL DEFAULT 1,
    zone TEXT,
    shift TEXT CHECK(shift IN ('day', 'night', 'weekend')) DEFAULT 'day',
    date DATE NOT NULL,
    piece_marks TEXT[], -- Array of piece mark IDs
    status TEXT CHECK(status IN ('scheduled', 'active', 'completed')) DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Field activities table
CREATE TABLE public.field_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    piece_mark_id UUID REFERENCES public.piece_marks(id),
    activity_type TEXT CHECK(activity_type IN ('received', 'moved', 'installed', 'inspection', 'issue')) NOT NULL,
    description TEXT NOT NULL,
    location TEXT CHECK(location IN ('yard', 'staging', 'crane_zone', 'installed', 'unknown')),
    crew_id UUID REFERENCES public.crew_assignments(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production Tables

-- Production stages table
CREATE TABLE public.production_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    stage_order INTEGER NOT NULL,
    department TEXT CHECK(department IN ('engineering', 'shop', 'paint', 'shipping', 'field')) NOT NULL,
    required_approvals INTEGER DEFAULT 0,
    estimated_hours DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production workflow table
CREATE TABLE public.production_workflow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    piece_mark_id UUID NOT NULL REFERENCES public.piece_marks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    current_stage_id UUID REFERENCES public.production_stages(id),
    status TEXT CHECK(status IN ('not_started', 'in_progress', 'on_hold', 'completed', 'cancelled')) DEFAULT 'not_started',
    priority TEXT CHECK(priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
    scheduled_start DATE,
    scheduled_end DATE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production tasks table
CREATE TABLE public.production_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.production_workflow(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.production_stages(id),
    task_name TEXT NOT NULL,
    task_type TEXT CHECK(task_type IN ('fabrication', 'welding', 'drilling', 'cutting', 'assembly', 'painting', 'inspection', 'shipping')) NOT NULL,
    status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')) DEFAULT 'pending',
    assigned_to UUID REFERENCES public.profiles(id),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stage transitions table
CREATE TABLE public.stage_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.production_workflow(id) ON DELETE CASCADE,
    from_stage_id UUID REFERENCES public.production_stages(id),
    to_stage_id UUID REFERENCES public.production_stages(id),
    transitioned_by UUID NOT NULL REFERENCES public.profiles(id),
    transition_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    duration_hours DECIMAL(10,2)
);

-- Production issues table
CREATE TABLE public.production_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.production_workflow(id) ON DELETE CASCADE,
    issue_type TEXT CHECK(issue_type IN ('material', 'equipment', 'labor', 'quality', 'design', 'weather', 'other')) NOT NULL,
    severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')) NOT NULL,
    description TEXT NOT NULL,
    impact_hours DECIMAL(10,2),
    reported_by UUID NOT NULL REFERENCES public.profiles(id),
    assigned_to UUID REFERENCES public.profiles(id),
    status TEXT CHECK(status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
    resolution TEXT,
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Production metrics table
CREATE TABLE public.production_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.production_workflow(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    pieces_completed INTEGER DEFAULT 0,
    weight_completed DECIMAL(12,2) DEFAULT 0,
    man_hours DECIMAL(10,2) DEFAULT 0,
    machine_hours DECIMAL(10,2) DEFAULT 0,
    efficiency_rate DECIMAL(5,2),
    defect_rate DECIMAL(5,2),
    rework_hours DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Material consumption table
CREATE TABLE public.material_consumption (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.production_workflow(id) ON DELETE CASCADE,
    material_type TEXT NOT NULL,
    planned_quantity DECIMAL(12,4) NOT NULL,
    actual_quantity DECIMAL(12,4),
    unit TEXT NOT NULL,
    waste_percentage DECIMAL(5,2),
    cost_per_unit DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    consumed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production attachments table
CREATE TABLE public.production_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.production_workflow(id) ON DELETE CASCADE,
    attachment_type TEXT CHECK(attachment_type IN ('drawing', 'photo', 'report', 'certificate', 'other')) NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality Control Tables

-- Quality inspections table
CREATE TABLE public.quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    piece_mark_id UUID NOT NULL REFERENCES public.piece_marks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    template_id UUID, -- Reference to checklist template (not implemented yet)
    inspection_type TEXT CHECK(inspection_type IN ('welding', 'dimensional', 'coating', 'bolting', 'general', 'final')) NOT NULL,
    inspector_id UUID NOT NULL REFERENCES public.profiles(id),
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK(status IN ('pending', 'in_progress', 'passed', 'failed', 'conditional')) DEFAULT 'pending',
    overall_result TEXT CHECK(overall_result IN ('pass', 'fail', 'conditional_pass', 'needs_reinspection')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspection items table
CREATE TABLE public.inspection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    specification TEXT,
    measured_value TEXT,
    tolerance_min DECIMAL(12,4),
    tolerance_max DECIMAL(12,4),
    actual_value DECIMAL(12,4),
    result TEXT CHECK(result IN ('pass', 'fail', 'na', 'conditional')) NOT NULL,
    comments TEXT,
    severity TEXT CHECK(severity IN ('critical', 'major', 'minor', 'observation')) DEFAULT 'minor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Welding inspections table
CREATE TABLE public.welding_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
    weld_type TEXT CHECK(weld_type IN ('fillet', 'groove', 'plug', 'slot', 'spot', 'seam')),
    weld_position TEXT, -- '1F', '2F', etc.
    electrode_type TEXT,
    welder_id UUID REFERENCES public.profiles(id),
    wps_number TEXT,
    visual_inspection TEXT CHECK(visual_inspection IN ('pass', 'fail', 'na', 'conditional')),
    penetration_test TEXT CHECK(penetration_test IN ('pass', 'fail', 'na', 'conditional')),
    magnetic_particle TEXT CHECK(magnetic_particle IN ('pass', 'fail', 'na', 'conditional')),
    ultrasonic_test TEXT CHECK(ultrasonic_test IN ('pass', 'fail', 'na', 'conditional')),
    radiographic_test TEXT CHECK(radiographic_test IN ('pass', 'fail', 'na', 'conditional')),
    weld_size_required DECIMAL(8,3),
    weld_size_actual DECIMAL(8,3),
    undercut_depth DECIMAL(8,3),
    porosity_level TEXT CHECK(porosity_level IN ('none', 'minor', 'moderate', 'excessive')),
    cracks_found BOOLEAN DEFAULT false,
    incomplete_fusion BOOLEAN DEFAULT false,
    spatter_level TEXT CHECK(spatter_level IN ('none', 'light', 'moderate', 'heavy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dimensional checks table
CREATE TABLE public.dimensional_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
    dimension_type TEXT NOT NULL,
    nominal_value DECIMAL(12,4) NOT NULL,
    tolerance_plus DECIMAL(12,4),
    tolerance_minus DECIMAL(12,4),
    actual_value DECIMAL(12,4) NOT NULL,
    unit TEXT CHECK(unit IN ('mm', 'inch', 'ft', 'm')) DEFAULT 'inch',
    measurement_tool TEXT,
    result TEXT CHECK(result IN ('pass', 'fail', 'marginal')) NOT NULL,
    deviation DECIMAL(12,4) GENERATED ALWAYS AS (actual_value - nominal_value) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NCR (Non-Conformance Report) table
CREATE TABLE public.ncr_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ncr_number TEXT UNIQUE NOT NULL,
    inspection_id UUID REFERENCES public.quality_inspections(id),
    piece_mark_id UUID REFERENCES public.piece_marks(id),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.profiles(id),
    assigned_to UUID REFERENCES public.profiles(id),
    description TEXT NOT NULL,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    severity TEXT CHECK(severity IN ('critical', 'major', 'minor')) NOT NULL,
    status TEXT CHECK(status IN ('open', 'in_review', 'approved', 'rejected', 'closed')) DEFAULT 'open',
    due_date DATE,
    closed_date DATE,
    cost_impact DECIMAL(12,2),
    time_impact_hours DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspection photos table
CREATE TABLE public.inspection_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES public.quality_inspections(id),
    inspection_item_id UUID REFERENCES public.inspection_items(id),
    ncr_id UUID REFERENCES public.ncr_reports(id),
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    photo_type TEXT CHECK(photo_type IN ('before', 'during', 'after', 'defect', 'repair', 'final')),
    annotated_url TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add field_location column to piece_marks
ALTER TABLE public.piece_marks 
ADD COLUMN field_location TEXT CHECK(field_location IN ('yard', 'staging', 'crane_zone', 'installed', 'unknown'));

-- Additional indexes for new tables
CREATE INDEX idx_deliveries_project ON public.deliveries(project_id);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);
CREATE INDEX idx_delivery_items_delivery ON public.delivery_items(delivery_id);
CREATE INDEX idx_delivery_items_piece_mark ON public.delivery_items(piece_mark_id);

CREATE INDEX idx_crew_assignments_project ON public.crew_assignments(project_id);
CREATE INDEX idx_crew_assignments_foreman ON public.crew_assignments(foreman_id);
CREATE INDEX idx_crew_assignments_date ON public.crew_assignments(date);

CREATE INDEX idx_field_activities_project ON public.field_activities(project_id);
CREATE INDEX idx_field_activities_piece_mark ON public.field_activities(piece_mark_id);
CREATE INDEX idx_field_activities_user ON public.field_activities(user_id);

CREATE INDEX idx_production_workflow_project ON public.production_workflow(project_id);
CREATE INDEX idx_production_workflow_piece_mark ON public.production_workflow(piece_mark_id);
CREATE INDEX idx_production_workflow_status ON public.production_workflow(status);

CREATE INDEX idx_production_tasks_workflow ON public.production_tasks(workflow_id);
CREATE INDEX idx_production_tasks_status ON public.production_tasks(status);

CREATE INDEX idx_quality_inspections_project ON public.quality_inspections(project_id);
CREATE INDEX idx_quality_inspections_piece_mark ON public.quality_inspections(piece_mark_id);
CREATE INDEX idx_quality_inspections_inspector ON public.quality_inspections(inspector_id);

-- Update triggers for new tables with updated_at
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crew_assignments_updated_at BEFORE UPDATE ON public.crew_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_workflow_updated_at BEFORE UPDATE ON public.production_workflow
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_inspections_updated_at BEFORE UPDATE ON public.quality_inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ncr_reports_updated_at BEFORE UPDATE ON public.ncr_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for new tables
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welding_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dimensional_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncr_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for field operations
CREATE POLICY "Field operations viewable by authenticated users" ON public.deliveries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Field operations viewable by authenticated users" ON public.delivery_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Field operations viewable by authenticated users" ON public.crew_assignments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Field operations viewable by authenticated users" ON public.field_activities
    FOR SELECT USING (auth.role() = 'authenticated');

-- Basic RLS policies for production
CREATE POLICY "Production viewable by authenticated users" ON public.production_stages
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Production viewable by authenticated users" ON public.production_workflow
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Production viewable by authenticated users" ON public.production_tasks
    FOR SELECT USING (auth.role() = 'authenticated');

-- Basic RLS policies for quality
CREATE POLICY "Quality inspections viewable by authenticated users" ON public.quality_inspections
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Quality inspections viewable by authenticated users" ON public.inspection_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Quality inspections viewable by authenticated users" ON public.welding_inspections
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Quality inspections viewable by authenticated users" ON public.dimensional_checks
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Quality inspections viewable by authenticated users" ON public.ncr_reports
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Quality inspections viewable by authenticated users" ON public.inspection_photos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert/update most records (can be refined later)
CREATE POLICY "Authenticated users can modify field operations" ON public.deliveries
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify field operations" ON public.delivery_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify field operations" ON public.crew_assignments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify field operations" ON public.field_activities
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify production" ON public.production_workflow
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify production" ON public.production_tasks
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify production" ON public.stage_transitions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify production" ON public.production_issues
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify production" ON public.production_metrics
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify production" ON public.material_consumption
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify production" ON public.production_attachments
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify quality" ON public.quality_inspections
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify quality" ON public.inspection_items
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify quality" ON public.welding_inspections
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify quality" ON public.dimensional_checks
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify quality" ON public.ncr_reports
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can modify quality" ON public.inspection_photos
    FOR ALL USING (auth.role() = 'authenticated');
