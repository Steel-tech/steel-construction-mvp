# Database Schema Documentation

## Overview
The Steel Construction MVP uses PostgreSQL (via Supabase) as the primary database. The schema is designed to track construction projects, steel piece marks, work orders, and field operations with comprehensive security and performance optimizations.

## Core Tables

### 1. Users & Authentication

#### `profiles`
Extends Supabase auth.users with additional profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | References auth.users |
| email | TEXT | User email (unique) |
| full_name | TEXT | User's full name |
| role | ENUM | User role (admin, project_manager, shop, field, client) |
| company | TEXT | Company name (optional) |
| phone | TEXT | Phone number (optional) |
| created_at | TIMESTAMP | Account creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes**: id (primary), email (unique)

---

### 2. Project Management

#### `projects`
Main projects table for construction projects.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Project identifier |
| project_number | TEXT | Unique project number |
| name | TEXT | Project name |
| description | TEXT | Project description |
| client_id | UUID (FK) | References profiles |
| project_manager_id | UUID (FK) | References profiles |
| status | ENUM | planning, active, completed, on_hold |
| start_date | DATE | Project start date |
| end_date | DATE | Project end date |
| budget | DECIMAL(12,2) | Project budget |
| address | TEXT | Project address |
| city | TEXT | Project city |
| state | TEXT | Project state |
| zip_code | TEXT | Project ZIP code |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |
| created_by | UUID (FK) | References auth.users |

**Indexes**: 
- idx_projects_client (client_id)
- idx_projects_manager (project_manager_id)
- idx_projects_status (status)

---

### 3. Steel Piece Tracking

#### `piece_marks`
Tracks individual steel pieces through fabrication and installation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Piece mark identifier |
| project_id | UUID (FK) | References projects |
| mark | TEXT | Piece mark code |
| description | TEXT | Piece description |
| quantity | INTEGER | Number of pieces |
| weight_per_piece | DECIMAL(10,2) | Weight per piece (lbs) |
| total_weight | DECIMAL(12,2) | Auto-calculated total weight |
| material_type | TEXT | Material specification |
| status | ENUM | not_started, fabricating, completed, shipped, installed |
| shop_assigned_to | UUID (FK) | References profiles |
| field_assigned_to | UUID (FK) | References profiles |
| drawing_number | TEXT | Drawing reference |
| sequence_number | INTEGER | Installation sequence |
| field_location | ENUM | yard, staging, crane_zone, installed, unknown |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes**: 
- idx_piece_marks_project (project_id)
- idx_piece_marks_status (status)
- idx_piece_marks_shop (shop_assigned_to)
- idx_piece_marks_field (field_assigned_to)

**Constraints**: UNIQUE(project_id, mark)

---

### 4. Work Order Management

#### `work_orders`
Manages fabrication, installation, and inspection tasks.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Work order identifier |
| project_id | UUID (FK) | References projects |
| work_order_number | TEXT | Unique work order number |
| title | TEXT | Work order title |
| description | TEXT | Detailed description |
| type | ENUM | fabrication, installation, inspection, repair |
| status | ENUM | pending, in_progress, completed, cancelled |
| priority | ENUM | low, medium, high, urgent |
| assigned_to | UUID (FK) | References profiles |
| due_date | DATE | Due date |
| completed_date | TIMESTAMP | Completion timestamp |
| notes | TEXT | Additional notes |
| created_by | UUID (FK) | References auth.users |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Indexes**: 
- idx_work_orders_project (project_id)
- idx_work_orders_assigned (assigned_to)
- idx_work_orders_status (status)

#### `work_order_piece_marks`
Junction table linking work orders to piece marks.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Record identifier |
| work_order_id | UUID (FK) | References work_orders |
| piece_mark_id | UUID (FK) | References piece_marks |
| quantity | INTEGER | Quantity for this work order |
| status | ENUM | pending, in_progress, completed |
| completed_at | TIMESTAMP | Completion time |
| notes | TEXT | Notes specific to this item |
| created_at | TIMESTAMP | Creation time |

**Constraints**: UNIQUE(work_order_id, piece_mark_id)

---

### 5. Field Operations

#### `deliveries`
Tracks deliveries to the construction site.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Delivery identifier |
| project_id | UUID (FK) | References projects |
| delivery_number | TEXT | Unique delivery number |
| truck_number | TEXT | Truck identification |
| driver_name | TEXT | Driver name |
| scheduled_date | DATE | Scheduled delivery date |
| actual_date | TIMESTAMP | Actual delivery time |
| status | ENUM | pending, in_transit, delivered, received, rejected |
| notes | TEXT | Delivery notes |
| received_by | UUID (FK) | References auth.users |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

**Constraints**: UNIQUE(project_id, delivery_number)

#### `delivery_items`
Individual items in a delivery.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Item identifier |
| delivery_id | UUID (FK) | References deliveries |
| piece_mark_id | UUID (FK) | References piece_marks |
| quantity | INTEGER | Expected quantity |
| received_quantity | INTEGER | Actually received quantity |
| location | ENUM | yard, staging, crane_zone, installed, unknown |
| condition | ENUM | good, damaged, missing |
| notes | TEXT | Item-specific notes |
| created_at | TIMESTAMP | Creation time |

**Constraints**: UNIQUE(delivery_id, piece_mark_id)

#### `crew_assignments`
Daily crew assignments and work allocation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Assignment identifier |
| project_id | UUID (FK) | References projects |
| crew_name | TEXT | Crew name |
| foreman_id | UUID (FK) | References profiles |
| crew_size | INTEGER | Number of workers |
| zone | TEXT | Work zone/area |
| shift | ENUM | day, night, weekend |
| date | DATE | Assignment date |
| piece_marks | TEXT[] | Array of piece mark IDs |
| status | ENUM | scheduled, active, completed |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update time |

#### `field_activities`
Logs all field activities for audit and tracking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Activity identifier |
| project_id | UUID (FK) | References projects |
| piece_mark_id | UUID (FK) | References piece_marks |
| activity_type | ENUM | received, moved, installed, inspection, issue |
| description | TEXT | Activity description |
| location | ENUM | yard, staging, crane_zone, installed, unknown |
| crew_id | UUID (FK) | References crew_assignments |
| user_id | UUID (FK) | References auth.users |
| photos | TEXT[] | Array of photo URLs |
| created_at | TIMESTAMP | Activity time |

---

### 6. Documentation

#### `progress_photos`
Stores progress photos for documentation.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Photo identifier |
| project_id | UUID (FK) | References projects |
| work_order_id | UUID (FK) | References work_orders |
| piece_mark_id | UUID (FK) | References piece_marks |
| photo_url | TEXT | Photo storage URL |
| thumbnail_url | TEXT | Thumbnail URL |
| caption | TEXT | Photo caption |
| uploaded_by | UUID (FK) | References auth.users |
| taken_at | TIMESTAMP | When photo was taken |
| created_at | TIMESTAMP | Upload time |

#### `activity_log`
System-wide activity audit log.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Log entry identifier |
| user_id | UUID (FK) | References auth.users |
| action | TEXT | Action performed |
| entity_type | TEXT | Entity type affected |
| entity_id | UUID | Entity identifier |
| details | JSONB | Additional details |
| ip_address | INET | User IP address |
| created_at | TIMESTAMP | Action time |

---

## Row Level Security (RLS) Policies

### Authentication-Based Policies

1. **Profiles**
   - SELECT: All authenticated users can view profiles
   - UPDATE: Users can only update their own profile

2. **Projects**
   - SELECT: All authenticated users can view projects
   - INSERT: Only admins and project managers
   - UPDATE: Admins and assigned project managers

3. **Piece Marks**
   - SELECT: All authenticated users can view
   - UPDATE: Shop/field workers for assigned pieces, admins, and PMs

4. **Work Orders**
   - SELECT: All authenticated users can view
   - UPDATE: Assigned users, admins, and project managers

5. **Field Operations**
   - Deliveries/Crew Assignments: Field users, admins, and PMs have full access
   - Field Activities: All authenticated users can create, view restricted by role

---

## Database Functions & Triggers

### `update_updated_at_column()`
Automatically updates the `updated_at` timestamp on row modifications.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
```

Applied to tables: profiles, projects, piece_marks, work_orders, deliveries, crew_assignments

### `handle_new_user()`
Creates a profile entry when a new user signs up.

```sql
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
```

---

## Performance Optimizations

### Indexes Strategy
- Primary keys on all tables (UUID)
- Foreign key indexes for JOIN performance
- Status field indexes for filtering
- Date field indexes for chronological queries
- Composite indexes for unique constraints

### Query Optimization Tips
1. Use specific field selection instead of SELECT *
2. Implement pagination for large result sets
3. Use database views for complex repeated queries
4. Leverage Supabase's built-in caching
5. Consider materialized views for reporting

---

## Data Types

### Custom ENUMs

```sql
-- User roles
CREATE TYPE user_role AS ENUM (
    'admin', 
    'project_manager', 
    'shop', 
    'field', 
    'client'
);

-- Project status
CREATE TYPE project_status AS ENUM (
    'planning', 
    'active', 
    'completed', 
    'on_hold'
);

-- Piece mark status
CREATE TYPE piece_mark_status AS ENUM (
    'not_started', 
    'fabricating', 
    'completed', 
    'shipped', 
    'installed'
);

-- Field locations
CREATE TYPE field_location AS ENUM (
    'yard', 
    'staging', 
    'crane_zone', 
    'installed', 
    'unknown'
);
```

---

## Migration Strategy

### Initial Setup
1. Run `supabase_schema.sql` - Core tables and auth
2. Run `field_operations_schema.sql` - Field operations tables
3. Apply seed data for testing

### Future Migrations
1. Create numbered migration files (001_description.sql)
2. Include both UP and DOWN migrations
3. Test in staging environment first
4. Apply to production during maintenance window

---

## Backup & Recovery

### Backup Strategy
- Automated daily backups via Supabase
- Point-in-time recovery available
- Export critical data weekly
- Test restore procedures monthly

### Data Retention
- Activity logs: 2 years
- Progress photos: Indefinite
- Deleted records: Soft delete with 30-day retention
- Completed projects: Archive after 5 years