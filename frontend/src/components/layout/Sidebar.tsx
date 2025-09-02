import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const linkBase =
  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `${linkBase} ${isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'}`;

const NavIcon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex h-5 w-5 items-center justify-center">{children}</span>
);

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'client';

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 border-r border-gray-200 bg-white min-h-screen">
      <div className="h-16 border-b border-gray-200 flex items-center px-4 text-lg font-semibold">
        Steel Construction
      </div>
      <nav className="p-4 space-y-1">
        <NavLink to="/" className={linkClass} end>
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M10 2L2 8h2v8h4V12h4v4h4V8h2L10 2z"/></svg>
          </NavIcon>
          Dashboard
        </NavLink>

        <NavLink to="/projects" className={linkClass}>
          <NavIcon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M4 3h12a1 1 0 011 1v2H3V4a1 1 0 011-1zm-1 6h14v7a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/></svg>
          </NavIcon>
          Projects
        </NavLink>

        {(role === 'admin' || role === 'project_manager' || role === 'shop' || role === 'field') && (
          <NavLink to="/work-orders" className={linkClass}>
            <NavIcon>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6 2a2 2 0 00-2 2v2h12V4a2 2 0 00-2-2H6zM4 8v6a2 2 0 002 2h8a2 2 0 002-2V8H4z"/></svg>
            </NavIcon>
            Work Orders
          </NavLink>
        )}

        {(role === 'admin' || role === 'project_manager' || role === 'field') && (
          <NavLink to="/projects/1/field" className={linkClass}>
            <NavIcon>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M2 11l6-6 3 3 5-5v12H2z"/></svg>
            </NavIcon>
            Field
          </NavLink>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;

