# Steel Construction MVP - Project Structure

## 📁 Complete Project Structure

```
steel-construction-mvp/
├── README.md                          # Project overview and setup instructions
├── docs/                              # Documentation
│   ├── project-structure.md          # This file - project organization guide
│   ├── database-schema.md            # Database tables and relationships
│   ├── api-spec.md                   # API endpoints documentation
│   └── deployment-guide.md           # Deployment instructions
│
├── frontend/                          # React TypeScript Frontend (Vite)
│   ├── package.json                  # Frontend dependencies
│   ├── package-lock.json            
│   ├── vite.config.ts                # Vite configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── postcss.config.js             # PostCSS configuration
│   ├── index.html                    # Entry HTML file
│   ├── .env.local                    # Environment variables (not in git)
│   │
│   ├── public/                       # Static assets
│   │   └── vite.svg
│   │
│   └── src/                          # Source code
│       ├── main.tsx                  # Application entry point
│       ├── App.tsx                   # Main App component with routing
│       ├── index.css                 # Global styles (Tailwind imports)
│       ├── vite-env.d.ts            # Vite type definitions
│       │
│       ├── components/               # Reusable components
│       │   ├── auth/                # Authentication components
│       │   │   ├── AuthContext.tsx  # Auth provider and context
│       │   │   ├── LoginForm.tsx    # Login form component
│       │   │   ├── SignupForm.tsx   # Registration form component
│       │   │   └── ProtectedRoute.tsx # Route protection wrapper
│       │   │
│       │   ├── piecemarks/          # Piece mark management
│       │   │   ├── PieceMarkForm.tsx # Create/edit piece marks
│       │   │   ├── PieceMarkList.tsx # Table view with actions
│       │   │   └── PieceMarkDashboard.tsx # Statistics dashboard
│       │   │
│       │   └── field/                # Field operations components
│       │       ├── DeliveryReceiving.tsx # Receive deliveries
│       │       ├── PieceLocationTracker.tsx # Track piece locations
│       │       └── CrewAssignment.tsx # Manage crew assignments
│       │
│       ├── pages/                    # Page components (routes)
│       │   ├── LoginPage.tsx        # Login page
│       │   ├── SignupPage.tsx       # Registration page
│       │   ├── DashboardPage.tsx    # Main dashboard
│       │   ├── ProjectsPage.tsx     # Projects list
│       │   ├── WorkOrdersPage.tsx   # Work orders management
│       │   ├── PieceMarksPage.tsx   # Piece marks for a project
│       │   └── FieldDashboard.tsx   # Field operations dashboard
│       │
│       ├── services/                 # API services
│       │   └── pieceMarkService.ts  # Piece mark CRUD operations
│       │
│       ├── lib/                      # External library configs
│       │   └── supabase.ts          # Supabase client setup
│       │
│       ├── types/                    # TypeScript type definitions
│       │   ├── database.types.ts    # Database schema types
│       │   └── field.types.ts       # Field operations types
│       │
│       ├── hooks/                    # Custom React hooks
│       │   └── (custom hooks here)
│       │
│       └── utils/                    # Utility functions
│           └── (utility functions here)
│
├── backend/                          # Express.js Backend (Legacy/Optional)
│   ├── package.json                 # Backend dependencies
│   ├── package-lock.json
│   ├── .env                         # Environment variables
│   └── server.js                    # Express server (SQLite-based)
│
├── database/                         # Database schemas and migrations
│   ├── schema.sql                   # SQLite schema (legacy)
│   ├── supabase_schema.sql          # Main Supabase PostgreSQL schema
│   ├── field_operations_schema.sql  # Field operations tables
│   ├── migrations/                  # Database migrations
│   └── seed-data/                   # Sample data for testing
│
└── .claude-code/                     # Claude Code configuration
    └── context.md                    # Project context for AI assistance
```

## 🏗️ Architecture Overview

### Frontend (React + TypeScript + Vite)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development
- **Styling**: Tailwind CSS for utility-first styling
- **Routing**: React Router v6
- **State Management**: React Context (AuthContext)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)

### Backend Services
- **Primary**: Supabase (BaaS)
  - PostgreSQL database
  - Built-in authentication
  - Row Level Security
  - Real-time subscriptions
  - File storage (for photos)

- **Legacy**: Express.js server (optional)
  - SQLite database
  - JWT authentication
  - REST API endpoints

### Database Structure
- **Users & Authentication**: Profiles, roles
- **Project Management**: Projects, work orders
- **Steel Tracking**: Piece marks, materials
- **Field Operations**: Deliveries, crew assignments, locations
- **Documentation**: Progress photos, activity logs

## 📦 Key Dependencies

### Frontend
```json
{
  "react": "^18.x",
  "typescript": "^5.x",
  "vite": "^5.x",
  "tailwindcss": "^3.x",
  "react-router-dom": "^6.x",
  "@supabase/supabase-js": "^2.x",
  "@supabase/auth-helpers-react": "^0.x"
}
```

### Backend (Legacy)
```json
{
  "express": "^4.x",
  "sqlite3": "^5.x",
  "bcryptjs": "^2.x",
  "jsonwebtoken": "^9.x",
  "cors": "^2.x",
  "dotenv": "^16.x"
}
```

## 🚀 Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd steel-construction-mvp
```

2. **Set up Frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

3. **Set up Database**
- Create a Supabase project
- Run schemas in order:
  1. `database/supabase_schema.sql`
  2. `database/field_operations_schema.sql`

4. **Access the application**
- Development: http://localhost:5173
- Login with created credentials

## 🔑 Environment Variables

### Frontend (.env.local)
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env) - Optional
```
PORT=5000
JWT_SECRET=your-secret-key
NODE_ENV=development
```

## 📱 Mobile Optimization

The application is fully responsive with mobile-first design:
- Touch-optimized interfaces
- Responsive grid layouts
- Sticky navigation headers
- Swipeable components
- Large tap targets (44px minimum)
- Progressive enhancement

## 🔒 Security Features

- Row Level Security (RLS) on all tables
- Role-based access control (RBAC)
- JWT authentication
- Secure password hashing
- Environment variable protection
- Input validation and sanitization

## 📈 Scalability Considerations

- Modular component architecture
- Service layer abstraction
- Database indexing strategy
- Lazy loading for performance
- Code splitting with React Router
- Optimized bundle sizes with Vite

## 🛠️ Development Workflow

1. **Feature Development**
   - Create feature branch
   - Implement in components/pages
   - Add types in types/
   - Create services if needed
   - Test locally

2. **Database Changes**
   - Create migration file
   - Update TypeScript types
   - Test with Supabase locally
   - Deploy to production

3. **Deployment**
   - Frontend: Vercel/Netlify
   - Database: Supabase Cloud
   - Environment: Staging → Production

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)