# Steel Construction MVP Project Context

## Project Overview
Building a shop-to-field steel construction management app focusing on piece mark tracking, production scheduling, and crew coordination.

## Tech Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + Real-time)
- Mobile: PWA with camera/QR scanner

## Key Features
1. Piece mark tracking (shop to field)
2. Production scheduling
3. Quality control checklists
4. Mobile scanning and photo capture
5. Real-time status updates

## User Roles
- Shop Manager, Production Worker, Shipping Coordinator
- Field Superintendent, Foreman, Ironworker

## Database Schema
- Users, Projects, PieceMarks, WorkOrders, QualityChecks, Photos

## Current Implementation Status

### ✅ Completed Features
1. **Authentication System**
   - Supabase Auth integration
   - Role-based access control
   - Protected routes
   - Login/Signup forms

2. **Project Management**
   - Project CRUD operations
   - Budget and timeline tracking
   - Client and PM assignment
   - Status management

3. **Piece Mark System**
   - Full CRUD operations
   - Status tracking (Not Started → Fabricating → Completed → Shipped → Installed)
   - Bulk operations
   - Search and filtering
   - Weight calculations
   - Material specifications

4. **Field Operations**
   - Delivery receiving with verification
   - Piece location tracking (Yard → Staging → Crane Zone → Installed)
   - Crew assignment management
   - Daily scheduling by shift
   - Mobile-optimized interface

5. **Work Order Management**
   - Create and assign work orders
   - Priority levels
   - Status tracking
   - Due date management

### 🚧 In Progress
- Real-time subscriptions for live updates
- QR code generation and scanning
- Photo upload functionality

### 📋 Planned Features
- Production scheduling dashboard
- Quality control checklists
- Advanced reporting system
- Offline support with service workers
- Push notifications
- Data export functionality

## Project Structure
```
steel-construction-mvp/
├── frontend/                    # React TypeScript app
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   │   ├── auth/          # Authentication
│   │   │   ├── piecemarks/    # Piece mark management
│   │   │   └── field/         # Field operations
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API services
│   │   ├── types/             # TypeScript definitions
│   │   └── lib/               # External configs
├── database/                   # SQL schemas
└── docs/                       # Documentation
```

## Key APIs & Services

### Authentication
- `AuthContext.tsx` - Auth provider with login/signup/logout
- Protected routes with role checking
- JWT token management

### Piece Mark Service
```typescript
pieceMarkService.ts:
- getByProject(projectId)
- create(pieceMark)
- update(id, updates)
- updateStatus(id, status)
- bulkUpdateStatus(ids, status)
- search(projectId, term)
- getStatistics(projectId)
```

### Field Operations
- Delivery receiving and verification
- Location tracking with visual indicators
- Crew assignment by shift (day/night/weekend)
- Activity logging

## Database Tables

### Core Tables
- `profiles` - User profiles with roles
- `projects` - Construction projects
- `piece_marks` - Steel piece tracking
- `work_orders` - Task management

### Field Tables
- `deliveries` - Shipment tracking
- `delivery_items` - Individual pieces in deliveries
- `crew_assignments` - Daily crew scheduling
- `field_activities` - Activity audit log

### Security
- Row Level Security (RLS) on all tables
- Role-based policies
- Automatic timestamps with triggers

## Mobile Optimization
- Touch-friendly interfaces (44px min tap targets)
- Responsive grids that adapt to screen size
- Sticky navigation headers
- Swipeable components
- Optimized for phones and tablets

## Development Commands
```bash
# Start development server
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Run type checking
cd frontend && tsc --noEmit

# Start Supabase locally
supabase start

# Apply database migrations
supabase db push
```

## Environment Variables
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Performance Optimizations
- Lazy loading for route components
- Database indexes on frequently queried fields
- Pagination for large datasets
- Optimized bundle splitting with Vite
- Image lazy loading for photos

## Security Measures
- Row Level Security (RLS) policies
- Input validation and sanitization
- HTTPS enforcement
- JWT authentication
- Environment variable protection
- SQL injection prevention with parameterized queries

## Testing Strategy
- Component testing with React Testing Library
- E2E testing with Playwright
- Database testing with Supabase local
- Mobile testing on actual devices

## Deployment
- Frontend: Vercel/Netlify
- Database: Supabase Cloud
- CI/CD: GitHub Actions
- Environments: Dev → Staging → Production

## Next Priority Tasks
1. **QR Code Integration**
   - Generate QR codes for each piece mark
   - Mobile scanner using device camera
   - Quick status updates via scanning

2. **Real-time Updates**
   - Supabase subscriptions for live changes
   - Status updates appear instantly
   - Multi-user collaboration

3. **Photo Documentation**
   - Progress photo uploads
   - Image compression
   - Gallery views per piece/project

4. **Production Scheduling**
   - Shop capacity planning
   - Gantt chart visualization
   - Resource allocation

5. **Quality Control**
   - Digital checklists
   - Inspector sign-offs
   - Non-conformance reports

## Common Workflows

### Shop Workflow
1. Receive work order
2. Scan/select piece marks
3. Update status to "Fabricating"
4. Complete quality checks
5. Mark as "Completed"
6. Prepare for shipping

### Field Workflow
1. Receive delivery
2. Scan pieces on arrival
3. Update locations
4. Assign to crews
5. Track installation
6. Document with photos

## API Endpoints (Supabase)
All API calls go through Supabase client:
- Auth: `supabase.auth.*`
- Database: `supabase.from('table').*`
- Storage: `supabase.storage.*`
- Realtime: `supabase.channel('name').*`

## Known Issues
- Deprecation warning for @supabase/auth-helpers-react
- Need to migrate to @supabase/ssr package
- Some npm audit vulnerabilities (non-critical)

## Support & Documentation
- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev
- Project README: /README.md
- Database Schema: /docs/database-schema.md

## Contact
For questions or issues, refer to:
- Project documentation in `/docs/`
- GitHub issues for bug reports
- Supabase dashboard for database management