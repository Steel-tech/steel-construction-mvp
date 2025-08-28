-- Field Operations Tables for Supabase

-- Deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    delivery_number TEXT NOT NULL,
    truck_number TEXT,
    driver_name TEXT,
    scheduled_date DATE NOT NULL,
    actual_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK(status IN ('pending', 'in_transit', 'delivered', 'received', 'rejected')) DEFAULT 'pending',
    notes TEXT,
    received_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, delivery_number)
);

-- Delivery items table
CREATE TABLE IF NOT EXISTS public.delivery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
    piece_mark_id UUID NOT NULL REFERENCES public.piece_marks(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    received_quantity INTEGER,
    location TEXT CHECK(location IN ('yard', 'staging', 'crane_zone', 'installed', 'unknown')),
    condition TEXT CHECK(condition IN ('good', 'damaged', 'missing')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(delivery_id, piece_mark_id)
);

-- Crew assignments table
CREATE TABLE IF NOT EXISTS public.crew_assignments (
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

-- Field activities log
CREATE TABLE IF NOT EXISTS public.field_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    piece_mark_id UUID REFERENCES public.piece_marks(id),
    activity_type TEXT CHECK(activity_type IN ('received', 'moved', 'installed', 'inspection', 'issue')) NOT NULL,
    description TEXT NOT NULL,
    location TEXT CHECK(location IN ('yard', 'staging', 'crane_zone', 'installed', 'unknown')),
    crew_id UUID REFERENCES public.crew_assignments(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    photos TEXT[], -- Array of photo URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add field location column to piece_marks if not exists
ALTER TABLE public.piece_marks 
ADD COLUMN IF NOT EXISTS field_location TEXT 
CHECK(field_location IN ('yard', 'staging', 'crane_zone', 'installed', 'unknown'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deliveries_project ON public.deliveries(project_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled ON public.deliveries(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_delivery_items_delivery ON public.delivery_items(delivery_id);
CREATE INDEX IF NOT EXISTS idx_crew_assignments_project ON public.crew_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_crew_assignments_date ON public.crew_assignments(date);
CREATE INDEX IF NOT EXISTS idx_field_activities_project ON public.field_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_field_activities_piece ON public.field_activities(piece_mark_id);

-- Enable RLS on new tables
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Deliveries policies
CREATE POLICY "Deliveries viewable by authenticated users" ON public.deliveries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Field users can manage deliveries" ON public.deliveries
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'project_manager', 'field')
            )
        )
    );

-- Delivery items policies
CREATE POLICY "Delivery items viewable by authenticated users" ON public.delivery_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Field users can manage delivery items" ON public.delivery_items
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'project_manager', 'field')
            )
        )
    );

-- Crew assignments policies
CREATE POLICY "Crew assignments viewable by authenticated users" ON public.crew_assignments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Field managers can manage crew assignments" ON public.crew_assignments
    FOR ALL USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid()
                AND role IN ('admin', 'project_manager', 'field')
            )
        )
    );

-- Field activities policies
CREATE POLICY "Field activities viewable by authenticated users" ON public.field_activities
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create field activities" ON public.field_activities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Update triggers for updated_at
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON public.deliveries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crew_assignments_updated_at BEFORE UPDATE ON public.crew_assignments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();