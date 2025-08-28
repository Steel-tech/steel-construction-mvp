import { supabase } from '../lib/supabase';
import type { PieceMark, PieceMarkStatus } from '../types/database.types';

export const pieceMarkService = {
  // Get all piece marks for a project
  async getByProject(projectId: string) {
    const { data, error } = await supabase
      .from('piece_marks')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get a single piece mark
  async getById(id: string) {
    const { data, error } = await supabase
      .from('piece_marks')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Create a new piece mark
  async create(pieceMark: Omit<PieceMark, 'id' | 'created_at' | 'updated_at' | 'total_weight'>) {
    const { data, error } = await supabase
      .from('piece_marks')
      .insert(pieceMark)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update a piece mark
  async update(id: string, updates: Partial<Omit<PieceMark, 'id' | 'created_at' | 'updated_at' | 'total_weight'>>) {
    const { data, error } = await supabase
      .from('piece_marks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Update piece mark status
  async updateStatus(id: string, status: PieceMarkStatus) {
    const { data, error } = await supabase
      .from('piece_marks')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete a piece mark
  async delete(id: string) {
    const { error } = await supabase
      .from('piece_marks')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Bulk update piece marks status
  async bulkUpdateStatus(ids: string[], status: PieceMarkStatus) {
    const { data, error } = await supabase
      .from('piece_marks')
      .update({ status })
      .in('id', ids)
      .select();
    
    if (error) throw error;
    return data;
  },

  // Get piece marks by status
  async getByStatus(projectId: string, status: PieceMarkStatus) {
    const { data, error } = await supabase
      .from('piece_marks')
      .select('*')
      .eq('project_id', projectId)
      .eq('status', status)
      .order('sequence_number', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Search piece marks
  async search(projectId: string, searchTerm: string) {
    const { data, error } = await supabase
      .from('piece_marks')
      .select('*')
      .eq('project_id', projectId)
      .or(`mark.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('sequence_number', { ascending: true });
    
    if (error) throw error;
    return data;
  },

  // Get piece mark statistics for a project
  async getStatistics(projectId: string) {
    const { data, error } = await supabase
      .from('piece_marks')
      .select('status, quantity')
      .eq('project_id', projectId);
    
    if (error) throw error;

    const stats = {
      total: 0,
      not_started: 0,
      fabricating: 0,
      completed: 0,
      shipped: 0,
      installed: 0,
    };

    data?.forEach(mark => {
      stats.total += mark.quantity;
      stats[mark.status as keyof typeof stats] += mark.quantity;
    });

    return stats;
  }
};