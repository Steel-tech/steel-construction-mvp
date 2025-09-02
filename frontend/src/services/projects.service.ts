/**
 * Projects Service - Handles all project-related operations
 */

import { apiService, type Project } from './api.service';

export interface ProjectProgress {
  project_id: string;
  stage: string;
  progress_percentage: number;
  notes?: string;
  updated_by: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  project_number?: string;
  budget?: number;
}

export class ProjectsService {
  /**
   * Get all projects
   */
  async getAll(): Promise<Project[]> {
    const response = await apiService.getProjects();
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  /**
   * Create a new project
   */
  async create(projectData: CreateProjectData): Promise<Project> {
    const response = await apiService.createProject(projectData);
    if (response.error) {
      throw new Error(response.error);
    }
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  /**
   * Get project progress
   */
  async getProgress(projectId: string): Promise<ProjectProgress[]> {
    const response = await apiService.getProjectProgress(projectId);
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  /**
   * Update project progress
   */
  async updateProgress(projectId: string, progressData: Omit<ProjectProgress, 'project_id' | 'updated_at'>): Promise<ProjectProgress> {
    const response = await apiService.updateProjectProgress(projectId, progressData);
    if (response.error) {
      throw new Error(response.error);
    }
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  /**
   * Get projects by status
   */
  async getByStatus(status: string): Promise<Project[]> {
    const projects = await this.getAll();
    return projects.filter(project => project.status === status);
  }

  /**
   * Search projects by name or description
   */
  async search(query: string): Promise<Project[]> {
    const projects = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return projects.filter(project => 
      project.name.toLowerCase().includes(lowerQuery) ||
      project.description.toLowerCase().includes(lowerQuery)
    );
  }
}

// Export singleton instance
export const projectsService = new ProjectsService();
export default projectsService;