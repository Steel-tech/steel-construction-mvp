import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-col items-center justify-center gap-1 text-xs ${isActive ? 'text-gray-900' : 'text-gray-600'}`;

const Icon: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex h-5 w-5 items-center justify-center">{children}</span>
);

export const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'client';

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur">
      <div className="max-w-3xl mx-auto px-6 py-2 grid grid-cols-4">
        <NavLink to="/" className={itemClass} end>
          <Icon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M10 2L2 8h2v8h4V12h4v4h4V8h2L10 2z"/></svg>
          </Icon>
          <span>Home</span>
        </NavLink>

        <NavLink to="/projects" className={itemClass}>
          <Icon>
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M4 3h12a1 1 0 011 1v2H3V4a1 1 0 011-1zm-1 6h14v7a1 1 0 01-1 1H4a1 1 0 01-1-1V9z"/></svg>
          </Icon>
          <span>Projects</span>
        </NavLink>

        {(role === 'admin' || role === 'project_manager' || role === 'shop' || role === 'field') && (
          <NavLink to="/work-orders" className={itemClass}>
            <Icon>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M6 2a2 2 0 00-2 2v2h12V4a2 2 0 00-2-2H6zM4 8v6a2 2 0 002 2h8a2 2 0 002-2V8H4z"/></svg>
            </Icon>
            <span>Orders</span>
          </NavLink>
        )}

        {(role === 'admin' || role === 'project_manager' || role === 'field') && (
          <NavLink to="/projects/1/field" className={itemClass}>
            <Icon>
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path d="M2 11l6-6 3 3 5-5v12H2z"/></svg>
            </Icon>
            <span>Field</span>
          </NavLink>
        )}
      </div>
    </nav>
  );
};

export default MobileNav;

