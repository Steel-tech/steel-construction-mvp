import { supabase } from '../lib/supabase';
import {
  QualityInspection,
  InspectionItem,
  WeldingInspection,
  DimensionalCheck,
  NCRReport,
  InspectionPhoto,
  QualityChecklistTemplate,
  WeldingInspectionFormData,
  DimensionalCheckFormData,
  InspectionSummary,
  ItemResult,
} from '../types/quality.types';

export class QualityService {
  // Get checklist templates
  async getChecklistTemplates(type?: string) {
    let query = supabase
      .from('quality_checklist_templates')
      .select('*')
      .eq('is_active', true);

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query.order('name');
    if (error) throw error;
    return data as QualityChecklistTemplate[];
  }

  // Create a new inspection
  async createInspection(
    pieceMarkId: string,
    projectId: string,
    inspectionType: string,
    inspectorId: string,
    templateId?: string
  ): Promise<QualityInspection> {
    const { data, error } = await supabase
      .from('quality_inspections')
      .insert({
        piece_mark_id: pieceMarkId,
        project_id: projectId,
        inspection_type: inspectionType,
        inspector_id: inspectorId,
        template_id: templateId,
        status: 'in_progress',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get inspections for a piece mark
  async getPieceMarkInspections(pieceMarkId: string): Promise<QualityInspection[]> {
    const { data, error } = await supabase
      .from('quality_inspections')
      .select(`
        *,
        inspector:profiles!inspector_id(full_name, email),
        template:quality_checklist_templates(name, type)
      `)
      .eq('piece_mark_id', pieceMarkId)
      .order('inspection_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get inspection details with all items
  async getInspectionDetails(inspectionId: string) {
    const [inspection, items, welding, dimensional, photos] = await Promise.all([
      this.getInspection(inspectionId),
      this.getInspectionItems(inspectionId),
      this.getWeldingInspection(inspectionId),
      this.getDimensionalChecks(inspectionId),
      this.getInspectionPhotos(inspectionId),
    ]);

    return {
      inspection,
      items,
      welding,
      dimensional,
      photos,
    };
  }

  private async getInspection(inspectionId: string): Promise<QualityInspection> {
    const { data, error } = await supabase
      .from('quality_inspections')
      .select('*')
      .eq('id', inspectionId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getInspectionItems(inspectionId: string): Promise<InspectionItem[]> {
    const { data, error } = await supabase
      .from('inspection_items')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('category, item_name');

    if (error) throw error;
    return data || [];
  }

  // Add inspection items
  async addInspectionItem(item: Omit<InspectionItem, 'id' | 'created_at'>): Promise<InspectionItem> {
    const { data, error } = await supabase
      .from('inspection_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Bulk add inspection items
  async addInspectionItems(items: Omit<InspectionItem, 'id' | 'created_at'>[]): Promise<InspectionItem[]> {
    const { data, error } = await supabase
      .from('inspection_items')
      .insert(items)
      .select();

    if (error) throw error;
    return data || [];
  }

  // Create welding inspection
  async createWeldingInspection(
    inspectionId: string,
    formData: WeldingInspectionFormData
  ): Promise<WeldingInspection> {
    // Create welding inspection record
    const weldingData = {
      inspection_id: inspectionId,
      weld_type: formData.weld_type,
      weld_position: formData.weld_position,
      electrode_type: formData.electrode_type,
      welder_id: formData.welder_id,
      wps_number: formData.wps_number,
      visual_inspection: this.determineOverallResult(Object.values(formData.visual_checks)),
      weld_size_required: formData.measurements.weld_size_required,
      weld_size_actual: formData.measurements.weld_size_actual,
      undercut_depth: formData.measurements.undercut_depth,
      penetration_test: formData.testing.penetration_test,
      magnetic_particle: formData.testing.magnetic_particle,
      ultrasonic_test: formData.testing.ultrasonic_test,
      radiographic_test: formData.testing.radiographic_test,
      cracks_found: formData.visual_checks.cracks === 'fail',
      porosity_level: this.getPorosityLevel(formData.visual_checks.porosity),
      spatter_level: this.getSpatterLevel(formData.visual_checks.spatter),
    };

    const { data: weldingInspection, error: weldingError } = await supabase
      .from('welding_inspections')
      .insert(weldingData)
      .select()
      .single();

    if (weldingError) throw weldingError;

    // Create inspection items for each check
    const inspectionItems: Omit<InspectionItem, 'id' | 'created_at'>[] = [];

    // Visual checks
    Object.entries(formData.visual_checks).forEach(([name, result]) => {
      inspectionItems.push({
        inspection_id: inspectionId,
        item_name: this.formatItemName(name),
        category: 'Visual Inspection',
        specification: this.getWeldingSpecification(name),
        result: result as ItemResult,
        severity: this.getWeldingSeverity(name, result),
        comments: undefined,
        measured_value: undefined,
        tolerance_min: undefined,
        tolerance_max: undefined,
        actual_value: undefined,
      });
    });

    // Dimensional checks
    inspectionItems.push({
      inspection_id: inspectionId,
      item_name: 'Weld Size',
      category: 'Dimensional',
      specification: `${formData.measurements.weld_size_required} mm`,
      measured_value: `${formData.measurements.weld_size_actual} mm`,
      tolerance_min: formData.measurements.weld_size_required - 1,
      tolerance_max: formData.measurements.weld_size_required + 1,
      actual_value: formData.measurements.weld_size_actual,
      result: this.checkTolerance(
        formData.measurements.weld_size_actual,
        formData.measurements.weld_size_required,
        1
      ),
      severity: 'major',
      comments: undefined,
    });

    // Testing results
    if (formData.testing.penetration_test) {
      inspectionItems.push({
        inspection_id: inspectionId,
        item_name: 'Dye Penetrant Test',
        category: 'Testing',
        result: formData.testing.penetration_test,
        severity: 'critical',
        specification: undefined,
        comments: undefined,
        measured_value: undefined,
        tolerance_min: undefined,
        tolerance_max: undefined,
        actual_value: undefined,
      });
    }

    await this.addInspectionItems(inspectionItems);

    return weldingInspection;
  }

  private async getWeldingInspection(inspectionId: string): Promise<WeldingInspection | null> {
    const { data, error } = await supabase
      .from('welding_inspections')
      .select('*')
      .eq('inspection_id', inspectionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No record found
      throw error;
    }
    return data;
  }

  // Create dimensional inspection
  async createDimensionalChecks(
    inspectionId: string,
    formData: DimensionalCheckFormData
  ): Promise<DimensionalCheck[]> {
    const checks: Omit<DimensionalCheck, 'id' | 'created_at' | 'deviation'>[] = [];

    // Overall dimensions
    Object.entries(formData.overall_dimensions).forEach(([type, values]) => {
      if (values) {
        checks.push({
          inspection_id: inspectionId,
          dimension_type: type,
          nominal_value: values.nominal,
          tolerance_plus: values.tolerance,
          tolerance_minus: values.tolerance,
          actual_value: values.actual,
          unit: 'mm',
          result: this.checkDimensionalTolerance(
            values.actual,
            values.nominal,
            values.tolerance
          ),
          measurement_tool: 'Tape Measure',
        });
      }
    });

    // Hole patterns
    if (formData.hole_patterns) {
      Object.entries(formData.hole_patterns).forEach(([type, values]) => {
        if (values) {
          checks.push({
            inspection_id: inspectionId,
            dimension_type: `hole_${type}`,
            nominal_value: values.nominal,
            tolerance_plus: values.tolerance,
            tolerance_minus: values.tolerance,
            actual_value: values.actual,
            unit: 'mm',
            result: this.checkDimensionalTolerance(
              values.actual,
              values.nominal,
              values.tolerance
            ),
            measurement_tool: 'Caliper',
          });
        }
      });
    }

    const { data, error } = await supabase
      .from('dimensional_checks')
      .insert(checks)
      .select();

    if (error) throw error;
    return data || [];
  }

  private async getDimensionalChecks(inspectionId: string): Promise<DimensionalCheck[]> {
    const { data, error } = await supabase
      .from('dimensional_checks')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('dimension_type');

    if (error) throw error;
    return data || [];
  }

  // Update inspection status and result
  async updateInspectionStatus(
    inspectionId: string,
    status: string,
    overallResult?: string,
    notes?: string
  ): Promise<QualityInspection> {
    const { data, error } = await supabase
      .from('quality_inspections')
      .update({
        status,
        overall_result: overallResult,
        notes,
      })
      .eq('id', inspectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create NCR Report
  async createNCR(ncr: Omit<NCRReport, 'id' | 'created_at' | 'updated_at'>): Promise<NCRReport> {
    const { data, error } = await supabase
      .from('ncr_reports')
      .insert(ncr)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get NCR reports for a project
  async getProjectNCRs(projectId: string): Promise<NCRReport[]> {
    const { data, error } = await supabase
      .from('ncr_reports')
      .select(`
        *,
        reporter:profiles!reported_by(full_name),
        assignee:profiles!assigned_to(full_name),
        piece_mark:piece_marks(mark, description)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Upload inspection photo
  async uploadInspectionPhoto(
    photo: File,
    inspectionId: string,
    photoType: string,
    caption?: string,
    itemId?: string,
    ncrId?: string
  ): Promise<InspectionPhoto> {
    const fileName = `inspections/${inspectionId}/${Date.now()}-${photo.name}`;
    
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('inspection-photos')
      .upload(fileName, photo);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('inspection-photos')
      .getPublicUrl(fileName);

    // Save to database
    const { data, error } = await supabase
      .from('inspection_photos')
      .insert({
        inspection_id: inspectionId,
        inspection_item_id: itemId,
        ncr_id: ncrId,
        photo_url: publicUrl,
        thumbnail_url: publicUrl, // In production, generate actual thumbnail
        caption,
        photo_type: photoType,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async getInspectionPhotos(inspectionId: string): Promise<InspectionPhoto[]> {
    const { data, error } = await supabase
      .from('inspection_photos')
      .select('*')
      .eq('inspection_id', inspectionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Calculate inspection summary
  calculateInspectionSummary(items: InspectionItem[]): InspectionSummary {
    const summary: InspectionSummary = {
      total_items: items.length,
      passed: 0,
      failed: 0,
      conditional: 0,
      na: 0,
      pass_rate: 0,
      critical_issues: 0,
      major_issues: 0,
      minor_issues: 0,
    };

    items.forEach(item => {
      switch (item.result) {
        case 'pass':
          summary.passed++;
          break;
        case 'fail':
          summary.failed++;
          break;
        case 'conditional':
          summary.conditional++;
          break;
        case 'na':
          summary.na++;
          break;
      }

      if (item.result === 'fail' || item.result === 'conditional') {
        switch (item.severity) {
          case 'critical':
            summary.critical_issues++;
            break;
          case 'major':
            summary.major_issues++;
            break;
          case 'minor':
            summary.minor_issues++;
            break;
        }
      }
    });

    const effectiveTotal = summary.total_items - summary.na;
    summary.pass_rate = effectiveTotal > 0 
      ? Math.round((summary.passed / effectiveTotal) * 100) 
      : 0;

    return summary;
  }

  // Helper methods
  private checkTolerance(actual: number, nominal: number, tolerance: number): ItemResult {
    const diff = Math.abs(actual - nominal);
    if (diff <= tolerance) return 'pass';
    if (diff <= tolerance * 1.5) return 'conditional';
    return 'fail';
  }

  private checkDimensionalTolerance(actual: number, nominal: number, tolerance: number): 'pass' | 'fail' | 'marginal' {
    const diff = Math.abs(actual - nominal);
    if (diff <= tolerance) return 'pass';
    if (diff <= tolerance * 1.2) return 'marginal';
    return 'fail';
  }

  private determineOverallResult(results: ItemResult[]): ItemResult {
    if (results.some(r => r === 'fail')) return 'fail';
    if (results.some(r => r === 'conditional')) return 'conditional';
    if (results.every(r => r === 'na')) return 'na';
    return 'pass';
  }

  private getPorosityLevel(result: ItemResult) {
    switch (result) {
      case 'pass': return 'none';
      case 'conditional': return 'minor';
      case 'fail': return 'excessive';
      default: return 'none';
    }
  }

  private getSpatterLevel(result: ItemResult) {
    switch (result) {
      case 'pass': return 'light';
      case 'conditional': return 'moderate';
      case 'fail': return 'heavy';
      default: return 'none';
    }
  }

  private formatItemName(name: string): string {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private getWeldingSpecification(item: string): string {
    const specs: Record<string, string> = {
      profile: 'Smooth and uniform',
      size: 'As per drawing',
      undercut: 'Max 1/32 inch',
      overlap: 'None permitted',
      cracks: 'None permitted',
      porosity: 'Minor surface only',
      spatter: 'Remove excessive',
    };
    return specs[item] || '';
  }

  private getWeldingSeverity(item: string, result: ItemResult) {
    if (result === 'pass' || result === 'na') return 'observation';
    
    const critical = ['cracks', 'incomplete_fusion'];
    const major = ['undercut', 'size', 'overlap'];
    
    if (critical.includes(item)) return 'critical';
    if (major.includes(item)) return 'major';
    return 'minor';
  }
}

export const qualityService = new QualityService();