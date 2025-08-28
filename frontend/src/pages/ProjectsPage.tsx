import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthContext';
import { supabase } from '../lib/supabase';
import type { Project } from '../types/database.types';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-semibold">Projects</h1>
            </div>
            
            {['admin', 'project_manager'].includes(profile?.role || '') && (
              <div className="flex items-center">
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                  New Project
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-6 text-center">
              <p className="text-gray-500">No projects found. Create your first project to get started.</p>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <li key={project.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-medium text-blue-600 truncate">
                                {project.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                Project #{project.project_number}
                              </p>
                            </div>
                            <div className="ml-2 flex-shrink-0 flex">
                              <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(project.status)}`}>
                                {project.status}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 sm:flex sm:justify-between">
                            <div className="sm:flex">
                              <p className="flex items-center text-sm text-gray-500">
                                {project.description || 'No description provided'}
                              </p>
                            </div>
                            <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                              {project.start_date && (
                                <p>
                                  Start: {new Date(project.start_date).toLocaleDateString()}
                                  {project.end_date && (
                                    <span> - End: {new Date(project.end_date).toLocaleDateString()}</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>
                          {project.budget && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-500">
                                Budget: ${project.budget.toLocaleString()}
                              </p>
                            </div>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/projects/${project.id}/piece-marks`);
                              }}
                              className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
                            >
                              📦 Piece Marks
                            </button>
                            {['admin', 'project_manager', 'field'].includes(profile?.role || '') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/projects/${project.id}/field`);
                                }}
                                className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200"
                              >
                                🏗️ Field Operations
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Navigate to project details
                              }}
                              className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                            >
                              📊 Details
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};