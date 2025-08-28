-- Quality Control Schema for Steel Construction MVP

-- Quality checklist templates
CREATE TABLE IF NOT EXISTS public.quality_checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('welding', 'dimensional', 'coating', 'bolting', 'general')) NOT NULL,
    description TEXT,
    checklist_items JSONB NOT NULL, -- Array of checklist items with criteria
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality inspections for piece marks
CREATE TABLE IF NOT EXISTS public.quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    piece_mark_id UUID NOT NULL REFERENCES public.piece_marks(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.quality_checklist_templates(id),
    inspection_type TEXT CHECK(inspection_type IN ('welding', 'dimensional', 'coating', 'bolting', 'general', 'final')) NOT NULL,
    inspector_id UUID NOT NULL REFERENCES public.profiles(id),
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK(status IN ('pending', 'in_progress', 'passed', 'failed', 'conditional')) DEFAULT 'pending',
    overall_result TEXT CHECK(overall_result IN ('pass', 'fail', 'conditional_pass', 'needs_reinspection')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual inspection items
CREATE TABLE IF NOT EXISTS public.inspection_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT NOT NULL,
    specification TEXT,
    measured_value TEXT,
    tolerance_min DECIMAL(10,4),
    tolerance_max DECIMAL(10,4),
    actual_value DECIMAL(10,4),
    result TEXT CHECK(result IN ('pass', 'fail', 'na', 'conditional')) NOT NULL,
    comments TEXT,
    severity TEXT CHECK(severity IN ('critical', 'major', 'minor', 'observation')) DEFAULT 'minor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Welding specific inspections
CREATE TABLE IF NOT EXISTS public.welding_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
    weld_type TEXT CHECK(weld_type IN ('fillet', 'groove', 'plug', 'slot', 'spot', 'seam')),
    weld_position TEXT CHECK(weld_position IN ('1F', '2F', '3F', '4F', '1G', '2G', '3G', '4G', '5G', '6G')),
    electrode_type TEXT,
    welder_id TEXT,
    wps_number TEXT, -- Welding Procedure Specification
    visual_inspection TEXT CHECK(visual_inspection IN ('pass', 'fail', 'conditional')),
    penetration_test TEXT CHECK(penetration_test IN ('pass', 'fail', 'na')),
    magnetic_particle TEXT CHECK(magnetic_particle IN ('pass', 'fail', 'na')),
    ultrasonic_test TEXT CHECK(ultrasonic_test IN ('pass', 'fail', 'na')),
    radiographic_test TEXT CHECK(radiographic_test IN ('pass', 'fail', 'na')),
    weld_size_required DECIMAL(10,4),
    weld_size_actual DECIMAL(10,4),
    undercut_depth DECIMAL(10,4),
    porosity_level TEXT CHECK(porosity_level IN ('none', 'minor', 'moderate', 'excessive')),
    cracks_found BOOLEAN DEFAULT false,
    incomplete_fusion BOOLEAN DEFAULT false,
    spatter_level TEXT CHECK(spatter_level IN ('none', 'light', 'moderate', 'heavy')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dimensional checks
CREATE TABLE IF NOT EXISTS public.dimensional_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
    dimension_type TEXT NOT NULL,
    nominal_value DECIMAL(12,4) NOT NULL,
    tolerance_plus DECIMAL(10,4),
    tolerance_minus DECIMAL(10,4),
    actual_value DECIMAL(12,4) NOT NULL,
    unit TEXT CHECK(unit IN ('mm', 'inch', 'ft', 'm')) DEFAULT 'mm',
    measurement_tool TEXT,
    result TEXT CHECK(result IN ('pass', 'fail', 'marginal')) NOT NULL,
    deviation DECIMAL(10,4) GENERATED ALWAYS AS (actual_value - nominal_value) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Non-conformance reports
CREATE TABLE IF NOT EXISTS public.ncr_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ncr_number TEXT UNIQUE NOT NULL,
    inspection_id UUID REFERENCES public.quality_inspections(id),
    piece_mark_id UUID REFERENCES public.piece_marks(id),
    project_id UUID NOT NULL REFERENCES public.projects(id),
    reported_by UUID NOT NULL REFERENCES public.profiles(id),
    assigned_to UUID REFERENCES public.profiles(id),
    description TEXT NOT NULL,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    severity TEXT CHECK(severity IN ('critical', 'major', 'minor')) NOT NULL,
    status TEXT CHECK(status IN ('open', 'in_review', 'approved', 'rejected', 'closed')) DEFAULT 'open',
    due_date DATE,
    closed_date TIMESTAMP WITH TIME ZONE,
    cost_impact DECIMAL(10,2),
    time_impact_hours INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspection photos
CREATE TABLE IF NOT EXISTS public.inspection_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES public.quality_inspections(id) ON DELETE CASCADE,
    inspection_item_id UUID REFERENCES public.inspection_items(id) ON DELETE CASCADE,
    ncr_id UUID REFERENCES public.ncr_reports(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    photo_type TEXT CHECK(photo_type IN ('before', 'during', 'after', 'defect', 'repair', 'final')),
    annotated_url TEXT, -- URL to annotated version if exists
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quality certificates
CREATE TABLE IF NOT EXISTS public.quality_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certificate_number TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id),
    piece_mark_id UUID REFERENCES public.piece_marks(id),
    inspection_id UUID REFERENCES public.quality_inspections(id),
    certificate_type TEXT CHECK(certificate_type IN ('material', 'welding', 'coating', 'dimensional', 'final')) NOT NULL,
    issued_date DATE NOT NULL,
    issued_by UUID NOT NULL REFERENCES public.profiles(id),
    approved_by UUID REFERENCES public.profiles(id),
    document_url TEXT,
    status TEXT CHECK(status IN ('draft', 'issued', 'void')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_quality_inspections_piece_mark ON public.quality_inspections(piece_mark_id);
CREATE INDEX idx_quality_inspections_project ON public.quality_inspections(project_id);
CREATE INDEX idx_quality_inspections_inspector ON public.quality_inspections(inspector_id);
CREATE INDEX idx_quality_inspections_status ON public.quality_inspections(status);
CREATE INDEX idx_inspection_items_inspection ON public.inspection_items(inspection_id);
CREATE INDEX idx_welding_inspections_inspection ON public.welding_inspections(inspection_id);
CREATE INDEX idx_dimensional_checks_inspection ON public.dimensional_checks(inspection_id);
CREATE INDEX idx_ncr_reports_project ON public.ncr_reports(project_id);
CREATE INDEX idx_ncr_reports_status ON public.ncr_reports(status);
CREATE INDEX idx_inspection_photos_inspection ON public.inspection_photos(inspection_id);

-- Enable RLS
ALTER TABLE public.quality_checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welding_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dimensional_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ncr_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Quality inspections viewable by authenticated users
CREATE POLICY "Quality inspections viewable by authenticated" ON public.quality_inspections
    FOR SELECT USING (auth.role() = 'authenticated');

-- Inspectors and managers can create/update inspections
CREATE POLICY "Inspectors can manage inspections" ON public.quality_inspections
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            auth.uid() = inspector_id OR
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'project_manager', 'shop')
            )
        )
    );

-- NCR reports viewable by authenticated users
CREATE POLICY "NCR reports viewable by authenticated" ON public.ncr_reports
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only certain roles can create NCR reports
CREATE POLICY "Quality roles can create NCR" ON public.ncr_reports
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'project_manager', 'shop')
        )
    );

-- Inspection photos viewable by authenticated
CREATE POLICY "Inspection photos viewable by authenticated" ON public.inspection_photos
    FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can upload inspection photos
CREATE POLICY "Authenticated can upload inspection photos" ON public.inspection_photos
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update triggers
CREATE TRIGGER update_quality_checklist_templates_updated_at BEFORE UPDATE ON public.quality_checklist_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_inspections_updated_at BEFORE UPDATE ON public.quality_inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ncr_reports_updated_at BEFORE UPDATE ON public.ncr_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample checklist templates
INSERT INTO public.quality_checklist_templates (name, type, description, checklist_items) VALUES
(
    'Standard Welding Inspection',
    'welding',
    'Comprehensive welding quality checklist for structural steel',
    '[
        {"category": "Visual Inspection", "items": [
            {"name": "Weld Profile", "criteria": "Smooth and uniform", "required": true},
            {"name": "Weld Size", "criteria": "As per drawing", "required": true},
            {"name": "Undercut", "criteria": "Max 1/32 inch", "required": true},
            {"name": "Overlap", "criteria": "None permitted", "required": true},
            {"name": "Cracks", "criteria": "None permitted", "required": true},
            {"name": "Porosity", "criteria": "Minor surface only", "required": true},
            {"name": "Spatter", "criteria": "Remove excessive", "required": false}
        ]},
        {"category": "Dimensional", "items": [
            {"name": "Leg Size", "criteria": "±1/16 inch", "required": true},
            {"name": "Throat Thickness", "criteria": "Min as specified", "required": true},
            {"name": "Weld Length", "criteria": "As per drawing", "required": true}
        ]},
        {"category": "Testing", "items": [
            {"name": "Dye Penetrant", "criteria": "If required", "required": false},
            {"name": "Magnetic Particle", "criteria": "If required", "required": false},
            {"name": "Ultrasonic", "criteria": "If required", "required": false}
        ]}
    ]'
),
(
    'Dimensional Verification',
    'dimensional',
    'Standard dimensional checking for fabricated steel members',
    '[
        {"category": "Overall Dimensions", "items": [
            {"name": "Length", "criteria": "±1/8 inch", "required": true},
            {"name": "Width", "criteria": "±1/16 inch", "required": true},
            {"name": "Height", "criteria": "±1/16 inch", "required": true},
            {"name": "Diagonal", "criteria": "±1/8 inch", "required": true}
        ]},
        {"category": "Hole Patterns", "items": [
            {"name": "Hole Diameter", "criteria": "+1/16 inch", "required": true},
            {"name": "Hole Spacing", "criteria": "±1/16 inch", "required": true},
            {"name": "Edge Distance", "criteria": "Min as specified", "required": true}
        ]},
        {"category": "Straightness", "items": [
            {"name": "Camber", "criteria": "L/1000 max", "required": true},
            {"name": "Sweep", "criteria": "L/1000 max", "required": true},
            {"name": "Twist", "criteria": "1° max", "required": false}
        ]}
    ]'
);