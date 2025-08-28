-- Production Workflow Schema for Steel Construction MVP
-- This schema tracks the complete production lifecycle of piece marks

-- Production workflow stages
CREATE TABLE IF NOT EXISTS public.production_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    stage_order INTEGER NOT NULL,
    department TEXT CHECK(department IN ('engineering', 'shop', 'paint', 'shipping', 'field')) NOT NULL,
    required_approvals INTEGER DEFAULT 1,
    estimated_hours DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production workflow tracking for each piece mark
CREATE TABLE IF NOT EXISTS public.production_workflow (
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
    progress_percentage INTEGER DEFAULT 0 CHECK(progress_percentage >= 0 AND progress_percentage <= 100),
    assigned_to UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stage transitions history
CREATE TABLE IF NOT EXISTS public.stage_transitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.production_workflow(id) ON DELETE CASCADE,
    from_stage_id UUID REFERENCES public.production_stages(id),
    to_stage_id UUID REFERENCES public.production_stages(id),
    transitioned_by UUID NOT NULL REFERENCES public.profiles(id),
    transition_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    duration_hours DECIMAL(10,2)
);

-- Production tasks for each stage
CREATE TABLE IF NOT EXISTS public.production_tasks (
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

-- Production metrics and time tracking
CREATE TABLE IF NOT EXISTS public.production_metrics (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(workflow_id, metric_date)
);

-- Production issues and delays
CREATE TABLE IF NOT EXISTS public.production_issues (
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

-- Production approvals
CREATE TABLE IF NOT EXISTS public.production_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.production_workflow(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES public.production_stages(id),
    approval_type TEXT CHECK(approval_type IN ('stage_completion', 'quality_check', 'shipment_release', 'final_inspection')) NOT NULL,
    approved_by UUID REFERENCES public.profiles(id),
    approval_status TEXT CHECK(approval_status IN ('pending', 'approved', 'rejected', 'conditional')) DEFAULT 'pending',
    approval_date TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Material consumption tracking
CREATE TABLE IF NOT EXISTS public.material_consumption (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES public.production_workflow(id) ON DELETE CASCADE,
    material_type TEXT NOT NULL,
    planned_quantity DECIMAL(12,2) NOT NULL,
    actual_quantity DECIMAL(12,2),
    unit TEXT NOT NULL,
    waste_percentage DECIMAL(5,2),
    cost_per_unit DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    consumed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Production attachments (drawings, photos, documents)
CREATE TABLE IF NOT EXISTS public.production_attachments (
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

-- Create indexes for performance
CREATE INDEX idx_production_workflow_piece_mark ON public.production_workflow(piece_mark_id);
CREATE INDEX idx_production_workflow_project ON public.production_workflow(project_id);
CREATE INDEX idx_production_workflow_status ON public.production_workflow(status);
CREATE INDEX idx_production_workflow_current_stage ON public.production_workflow(current_stage_id);
CREATE INDEX idx_production_tasks_workflow ON public.production_tasks(workflow_id);
CREATE INDEX idx_production_tasks_status ON public.production_tasks(status);
CREATE INDEX idx_stage_transitions_workflow ON public.stage_transitions(workflow_id);
CREATE INDEX idx_production_issues_workflow ON public.production_issues(workflow_id);
CREATE INDEX idx_production_issues_status ON public.production_issues(status);
CREATE INDEX idx_production_metrics_date ON public.production_metrics(metric_date);

-- Enable RLS
ALTER TABLE public.production_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_workflow ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stage_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Production workflow viewable by authenticated users
CREATE POLICY "Production workflow viewable by authenticated" ON public.production_workflow
    FOR SELECT USING (auth.role() = 'authenticated');

-- Shop and managers can update production workflow
CREATE POLICY "Shop can manage production" ON public.production_workflow
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'project_manager', 'shop')
            )
        )
    );

-- Production tasks manageable by assigned users and managers
CREATE POLICY "Manage production tasks" ON public.production_tasks
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            assigned_to = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'project_manager', 'shop')
            )
        )
    );

-- Issues viewable by all, editable by authorized
CREATE POLICY "View production issues" ON public.production_issues
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Manage production issues" ON public.production_issues
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update production issues" ON public.production_issues
    FOR UPDATE USING (
        reported_by = auth.uid() OR
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'project_manager', 'shop')
        )
    );

-- Update triggers
CREATE TRIGGER update_production_workflow_updated_at BEFORE UPDATE ON public.production_workflow
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default production stages
INSERT INTO public.production_stages (name, stage_order, department, required_approvals, estimated_hours) VALUES
('Engineering Review', 1, 'engineering', 1, 2.0),
('Material Preparation', 2, 'shop', 1, 4.0),
('Cutting', 3, 'shop', 0, 3.0),
('Drilling & Punching', 4, 'shop', 0, 2.5),
('Fitting', 5, 'shop', 0, 4.0),
('Welding', 6, 'shop', 1, 6.0),
('Quality Inspection', 7, 'shop', 1, 1.5),
('Surface Preparation', 8, 'paint', 0, 2.0),
('Painting/Galvanizing', 9, 'paint', 1, 4.0),
('Final QC', 10, 'shop', 1, 1.0),
('Shipping Preparation', 11, 'shipping', 0, 2.0),
('Ready for Shipment', 12, 'shipping', 1, 0.5);