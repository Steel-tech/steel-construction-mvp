/**
 * Materials Service - Handles all material-related operations
 */

import { apiService, type Material } from './api.service';

export interface CreateMaterialData {
  name: string;
  type: string;
  grade: string;
  supplier: string;
  quantity: number;
  unit: string;
  cost_per_unit: number;
  total_cost: number;
}

export interface MaterialFilter {
  type?: string;
  grade?: string;
  supplier?: string;
}

export class MaterialsService {
  /**
   * Get all materials
   */
  async getAll(): Promise<Material[]> {
    const response = await apiService.getMaterials();
    if (response.error) {
      throw new Error(response.error);
    }
    return response.data || [];
  }

  /**
   * Create a new material
   */
  async create(materialData: CreateMaterialData): Promise<Material> {
    const response = await apiService.createMaterial(materialData);
    if (response.error) {
      throw new Error(response.error);
    }
    if (!response.data) {
      throw new Error('No data received from server');
    }
    return response.data;
  }

  /**
   * Get materials by type
   */
  async getByType(type: string): Promise<Material[]> {
    const materials = await this.getAll();
    return materials.filter(material => material.type === type);
  }

  /**
   * Get materials by supplier
   */
  async getBySupplier(supplier: string): Promise<Material[]> {
    const materials = await this.getAll();
    return materials.filter(material => material.supplier === supplier);
  }

  /**
   * Filter materials
   */
  async filter(filters: MaterialFilter): Promise<Material[]> {
    const materials = await this.getAll();
    return materials.filter(material => {
      if (filters.type && material.type !== filters.type) return false;
      if (filters.grade && material.grade !== filters.grade) return false;
      if (filters.supplier && material.supplier !== filters.supplier) return false;
      return true;
    });
  }

  /**
   * Search materials by name
   */
  async search(query: string): Promise<Material[]> {
    const materials = await this.getAll();
    const lowerQuery = query.toLowerCase();
    return materials.filter(material => 
      material.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Calculate total inventory value
   */
  async getTotalValue(): Promise<number> {
    const materials = await this.getAll();
    return materials.reduce((total, material) => total + material.total_cost, 0);
  }

  /**
   * Get unique material types
   */
  async getTypes(): Promise<string[]> {
    const materials = await this.getAll();
    const types = new Set(materials.map(material => material.type));
    return Array.from(types).sort();
  }

  /**
   * Get unique suppliers
   */
  async getSuppliers(): Promise<string[]> {
    const materials = await this.getAll();
    const suppliers = new Set(materials.map(material => material.supplier));
    return Array.from(suppliers).sort();
  }

  /**
   * Get unique grades
   */
  async getGrades(): Promise<string[]> {
    const materials = await this.getAll();
    const grades = new Set(materials.map(material => material.grade));
    return Array.from(grades).sort();
  }
}

// Export singleton instance
export const materialsService = new MaterialsService();
export default materialsService;