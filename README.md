# Steel Construction MVP

A modern web application for managing steel construction projects, work orders, and piece marks. Built with React, TypeScript, Vite, and Supabase.

## Features

### Authentication & Authorization
- User registration and login with role-based access control
- Support for multiple user roles: Admin, Project Manager, Shop Worker, Field Worker, Client
- Protected routes based on user roles

### Project Management
- Create and manage construction projects
- Track project status (Planning, Active, Completed, On Hold)
- Budget tracking and timeline management
- Client and project manager assignment

### Work Orders
- Create work orders for fabrication, installation, inspection, and repair tasks
- Priority levels (Low, Medium, High, Urgent)
- Status tracking (Pending, In Progress, Completed, Cancelled)
- Assignment to shop and field workers

### Piece Mark Tracking
- Track individual steel pieces through the construction process
- Status monitoring (Not Started, Fabricating, Completed, Shipped, Installed)
- Weight calculations and material specifications
- Integration with work orders

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Supabase Client** for backend integration

### Backend
- **Supabase** (PostgreSQL database)
- Row Level Security (RLS) policies
- Real-time subscriptions
- Built-in authentication

### Database Schema
- Users/Profiles management
- Projects tracking
- Piece marks inventory
- Work orders system
- Progress photos
- Activity logging

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd steel-construction-mvp
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Configure environment variables:
```bash
# In frontend/.env.local
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:
   - Create a new Supabase project
   - Run the SQL schema from `database/supabase_schema.sql`
   - Configure authentication settings

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
steel-construction-mvp/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   │   └── auth/       # Authentication components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Supabase client setup
│   │   ├── types/          # TypeScript type definitions
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── services/       # API services
│   ├── public/             # Static assets
│   └── package.json
├── backend/                 # Legacy Express backend (optional)
└── database/               # Database schemas
    ├── schema.sql         # SQLite schema (legacy)
    └── supabase_schema.sql # Supabase PostgreSQL schema
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## User Roles

1. **Admin**: Full system access, can manage all projects and users
2. **Project Manager**: Can manage assigned projects and work orders
3. **Shop Worker**: Can update piece marks and work orders in fabrication
4. **Field Worker**: Can update installation progress and complete work orders
5. **Client**: Can view their projects and progress updates

## Security Features

- Row Level Security (RLS) policies on all tables
- JWT-based authentication
- Role-based access control
- Secure password hashing with bcrypt
- Protected API endpoints

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, please open an issue in the GitHub repository.