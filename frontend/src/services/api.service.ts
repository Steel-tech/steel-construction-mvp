/**
 * API Service Layer - Connects frontend to local Express backend
 * Handles authentication, request/response formatting, and error handling
 */

// Types for API responses
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  details?: any[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  name: string;
  type: string;
  grade: string;
  supplier: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

/**
 * Main API Service Class
 */
class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    // Use environment variable with fallback
    this.baseURL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'https://steel-construction-api.onrender.com/api/v1';
    
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
    
    // Log for debugging
    console.log('API Service initialized with baseURL:', this.baseURL);
  }

  /**
   * Set authentication token
   */
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get current authentication token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  /**
   * Get authorization headers
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Generic HTTP request method with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      };

      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP ${response.status}: ${response.statusText}`,
          details: data.details,
        };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Network request failed',
      };
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // ==================== AUTH METHODS ====================

  /**
   * Register new user
   */
  async register(userData: RegisterData): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/register', userData);
    
    // Set token if registration successful
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await this.post<AuthResponse>('/auth/login', credentials);
    
    // Set token if login successful
    if (response.data?.token) {
      this.setToken(response.data.token);
    }
    
    return response;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    this.clearToken();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ==================== PROJECT METHODS ====================

  /**
   * Get all projects
   */
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.get<Project[]>('/projects');
  }

  /**
   * Create new project
   */
  async createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Project>> {
    return this.post<Project>('/projects', projectData);
  }

  /**
   * Get project progress
   */
  async getProjectProgress(projectId: string): Promise<ApiResponse<any>> {
    return this.get(`/projects/${projectId}/progress`);
  }

  /**
   * Update project progress
   */
  async updateProjectProgress(projectId: string, progressData: any): Promise<ApiResponse<any>> {
    return this.post(`/projects/${projectId}/progress`, progressData);
  }

  // ==================== MATERIAL METHODS ====================

  /**
   * Get all materials
   */
  async getMaterials(): Promise<ApiResponse<Material[]>> {
    return this.get<Material[]>('/materials');
  }

  /**
   * Create new material
   */
  async createMaterial(materialData: Omit<Material, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Material>> {
    return this.post<Material>('/materials', materialData);
  }

  // ==================== HEALTH CHECK ====================

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.get('/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;