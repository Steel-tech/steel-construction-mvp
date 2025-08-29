import { supabase } from '../lib/supabase';
import type {
  SecurityEvent,
  SecurityEventRequest,
  SecurityRule,
  SecurityRuleRequest,
  SecurityAlert,
  SecurityMetrics,
  SecurityConfiguration,
  IPWhitelist,
  IPBlacklist,
  SecuritySession,
  SecurityAuditLog,
  VulnerabilityReport,
  SecurityLevel,
  SecurityEventType,
} from '../types/security.types';

export class SecurityService {
  private static instance: SecurityService;
  private eventBuffer: SecurityEvent[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 100;

  constructor() {
    // Start periodic flush of buffered events
    setInterval(() => this.flushEventBuffer(), this.flushInterval);
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }

  // ==================== Event Management ====================

  async recordEvent(eventData: SecurityEventRequest, immediate: boolean = false): Promise<SecurityEvent> {
    const user = await supabase.auth.getUser();
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      ...eventData,
      status: 'active',
      user_id: user.data.user?.id,
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    if (immediate || event.level === 'critical' || event.level === 'high') {
      await this.persistEvent(event);
      await this.checkSecurityRules(event);
    } else {
      this.eventBuffer.push(event);
      if (this.eventBuffer.length >= this.maxBufferSize) {
        await this.flushEventBuffer();
      }
    }

    return event;
  }

  private async persistEvent(event: SecurityEvent): Promise<void> {
    const { error } = await supabase
      .from('security_events')
      .insert(event);

    if (error) {
      console.error('Failed to persist security event:', error);
    }
  }

  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      const { error } = await supabase
        .from('security_events')
        .insert(events);

      if (error) {
        console.error('Failed to flush security events:', error);
        // Re-add events to buffer if flush failed
        this.eventBuffer.unshift(...events);
      } else {
        // Check rules for each event
        for (const event of events) {
          await this.checkSecurityRules(event);
        }
      }
    } catch (err) {
      console.error('Error flushing security events:', err);
      this.eventBuffer.unshift(...events);
    }
  }

  async getEvents(
    projectId?: string,
    limit: number = 100,
    level?: SecurityLevel,
    type?: SecurityEventType
  ): Promise<SecurityEvent[]> {
    let query = supabase
      .from('security_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (level) {
      query = query.eq('level', level);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ==================== Security Rules ====================

  async createSecurityRule(rule: SecurityRuleRequest): Promise<SecurityRule> {
    const user = await supabase.auth.getUser();
    const newRule: Omit<SecurityRule, 'id' | 'created_at' | 'updated_at'> = {
      ...rule,
      enabled: true,
    };

    const { data, error } = await supabase
      .from('security_rules')
      .insert(newRule)
      .select()
      .single();

    if (error) throw error;

    // Record configuration change
    await this.recordEvent({
      type: 'configuration_change',
      level: 'medium',
      title: 'Security Rule Created',
      description: `New security rule "${rule.name}" was created`,
      metadata: { rule_name: rule.name, rule_type: rule.type },
    });

    return data;
  }

  async getSecurityRules(): Promise<SecurityRule[]> {
    const { data, error } = await supabase
      .from('security_rules')
      .select('*')
      .eq('enabled', true)
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  async updateSecurityRule(ruleId: string, updates: Partial<SecurityRule>): Promise<SecurityRule> {
    const { data, error } = await supabase
      .from('security_rules')
      .update(updates)
      .eq('id', ruleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async checkSecurityRules(event: SecurityEvent): Promise<void> {
    const rules = await this.getSecurityRules();
    
    for (const rule of rules) {
      if (this.evaluateRule(rule, event)) {
        await this.executeRuleActions(rule, event);
      }
    }
  }

  private evaluateRule(rule: SecurityRule, event: SecurityEvent): boolean {
    return rule.conditions.every(condition => {
      const eventValue = this.getEventFieldValue(event, condition.field);
      return this.evaluateCondition(condition, eventValue);
    });
  }

  private evaluateCondition(condition: any, value: any): boolean {
    const { operator, value: conditionValue, case_sensitive } = condition;
    
    let compareValue = value;
    let targetValue = conditionValue;
    
    if (typeof value === 'string' && !case_sensitive) {
      compareValue = value.toLowerCase();
      targetValue = String(conditionValue).toLowerCase();
    }

    switch (operator) {
      case 'equals':
        return compareValue === targetValue;
      case 'not_equals':
        return compareValue !== targetValue;
      case 'contains':
        return String(compareValue).includes(String(targetValue));
      case 'not_contains':
        return !String(compareValue).includes(String(targetValue));
      case 'greater_than':
        return Number(compareValue) > Number(targetValue);
      case 'less_than':
        return Number(compareValue) < Number(targetValue);
      case 'matches_regex':
        return new RegExp(String(targetValue)).test(String(compareValue));
      default:
        return false;
    }
  }

  private getEventFieldValue(event: SecurityEvent, field: string): any {
    return (event as any)[field] || event.metadata?.[field];
  }

  private async executeRuleActions(rule: SecurityRule, event: SecurityEvent): Promise<void> {
    for (const action of rule.actions) {
      switch (action.type) {
        case 'alert':
          await this.createSecurityAlert(rule, event);
          break;
        case 'block':
          if (event.ip_address) {
            await this.addToBlacklist(event.ip_address, `Blocked by rule: ${rule.name}`);
          }
          break;
        case 'log':
          console.warn(`Security rule triggered: ${rule.name}`, { rule, event });
          break;
        // Additional actions can be implemented here
      }
    }
  }

  // ==================== Security Alerts ====================

  private async createSecurityAlert(rule: SecurityRule, event: SecurityEvent): Promise<SecurityAlert> {
    const alert: Omit<SecurityAlert, 'id' | 'created_at'> = {
      rule_id: rule.id,
      event_id: event.id,
      title: `Security Alert: ${rule.name}`,
      description: event.description,
      level: rule.severity,
      status: 'new',
      affected_user: event.user_id,
      affected_resource: event.resource,
      recommended_actions: this.generateRecommendedActions(rule, event),
    };

    const { data, error } = await supabase
      .from('security_alerts')
      .insert(alert)
      .select()
      .single();

    if (error) throw error;

    // Send notification for high/critical alerts
    if (alert.level === 'high' || alert.level === 'critical') {
      await this.sendSecurityNotification(data);
    }

    return data;
  }

  private generateRecommendedActions(rule: SecurityRule, event: SecurityEvent): string[] {
    const actions: string[] = [];
    
    switch (event.type) {
      case 'auth_failed_login':
        actions.push('Review login attempts', 'Consider account lockout', 'Verify user identity');
        break;
      case 'suspicious_activity':
        actions.push('Investigate user behavior', 'Review access patterns', 'Consider additional monitoring');
        break;
      case 'api_rate_limit_exceeded':
        actions.push('Review API usage patterns', 'Consider rate limit adjustments', 'Check for bot activity');
        break;
      default:
        actions.push('Review event details', 'Investigate potential threat', 'Update security policies if needed');
    }

    return actions;
  }

  async getSecurityAlerts(status?: SecurityAlert['status']): Promise<SecurityAlert[]> {
    let query = supabase
      .from('security_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateAlertStatus(
    alertId: string, 
    status: SecurityAlert['status'], 
    notes?: string
  ): Promise<SecurityAlert> {
    const user = await supabase.auth.getUser();
    const updates: any = { status };

    if (status === 'acknowledged') {
      updates.acknowledged_at = new Date().toISOString();
      updates.acknowledged_by = user.data.user?.id;
    } else if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = user.data.user?.id;
      if (notes) {
        updates.resolution_notes = notes;
      }
    }

    const { data, error } = await supabase
      .from('security_alerts')
      .update(updates)
      .eq('id', alertId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ==================== IP Management ====================

  async addToWhitelist(ipAddress: string, description?: string, userId?: string): Promise<IPWhitelist> {
    const user = await supabase.auth.getUser();
    const whitelist: Omit<IPWhitelist, 'id' | 'created_at'> = {
      ip_address: ipAddress,
      description,
      user_id: userId,
      created_by: user.data.user?.id || '',
    };

    const { data, error } = await supabase
      .from('ip_whitelist')
      .insert(whitelist)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addToBlacklist(ipAddress: string, reason: string): Promise<IPBlacklist> {
    const user = await supabase.auth.getUser();
    const blacklist: Omit<IPBlacklist, 'id' | 'created_at' | 'updated_at'> = {
      ip_address: ipAddress,
      reason,
      blocked_by: user.data.user?.id || '',
    };

    const { data, error } = await supabase
      .from('ip_blacklist')
      .insert(blacklist)
      .select()
      .single();

    if (error) throw error;

    await this.recordEvent({
      type: 'ip_blacklisted',
      level: 'high',
      title: 'IP Address Blacklisted',
      description: `IP ${ipAddress} has been added to blacklist: ${reason}`,
      metadata: { ip_address: ipAddress, reason },
    });

    return data;
  }

  async isIPBlacklisted(ipAddress: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('ip_blacklist')
      .select('id')
      .eq('ip_address', ipAddress)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  async isIPWhitelisted(ipAddress: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('ip_whitelist')
      .select('id')
      .eq('ip_address', ipAddress)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  // ==================== Security Metrics ====================

  async getSecurityMetrics(projectId?: string, days: number = 30): Promise<SecurityMetrics> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('security_events')
      .select('*')
      .gte('timestamp', startDate.toISOString());

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: events, error } = await query;
    if (error) throw error;

    const alerts = await this.getSecurityAlerts();
    
    return this.calculateMetrics(events || [], alerts);
  }

  private calculateMetrics(events: SecurityEvent[], alerts: SecurityAlert[]): SecurityMetrics {
    const eventsByLevel: Record<SecurityLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    const eventsByType: Record<SecurityEventType, number> = {} as any;

    let blockedRequests = 0;
    let failedLogins = 0;
    let suspiciousActivities = 0;
    let vulnerabilitiesDetected = 0;

    events.forEach(event => {
      eventsByLevel[event.level]++;
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      switch (event.type) {
        case 'auth_failed_login':
          failedLogins++;
          break;
        case 'suspicious_activity':
          suspiciousActivities++;
          break;
        case 'vulnerability_detected':
          vulnerabilitiesDetected++;
          break;
        case 'api_rate_limit_exceeded':
        case 'malicious_request':
          blockedRequests++;
          break;
      }
    });

    const activeAlerts = alerts.filter(a => a.status === 'new' || a.status === 'investigating').length;
    const resolvedAlerts = alerts.filter(a => a.status === 'resolved').length;

    // Calculate average time to resolution
    const resolvedAlertsWithTimes = alerts.filter(a => a.resolved_at && a.created_at);
    const avgResolutionTime = resolvedAlertsWithTimes.length > 0
      ? resolvedAlertsWithTimes.reduce((sum, alert) => {
          const created = new Date(alert.created_at).getTime();
          const resolved = new Date(alert.resolved_at!).getTime();
          return sum + (resolved - created);
        }, 0) / (resolvedAlertsWithTimes.length * 60000) // Convert to minutes
      : 0;

    // Calculate security score (0-100)
    const securityScore = this.calculateSecurityScore(events, alerts);

    // Get top threat sources
    const ipCounts: Record<string, number> = {};
    events.forEach(event => {
      if (event.ip_address) {
        ipCounts[event.ip_address] = (ipCounts[event.ip_address] || 0) + 1;
      }
    });

    const topThreatSources = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, events]) => ({ ip, events }));

    return {
      total_events: events.length,
      events_by_level: eventsByLevel,
      events_by_type: eventsByType,
      blocked_requests: blockedRequests,
      failed_logins: failedLogins,
      suspicious_activities: suspiciousActivities,
      vulnerabilities_detected: vulnerabilitiesDetected,
      active_alerts: activeAlerts,
      resolved_alerts: resolvedAlerts,
      time_to_resolution_avg: avgResolutionTime,
      top_threat_sources: topThreatSources,
      security_score: securityScore,
    };
  }

  private calculateSecurityScore(events: SecurityEvent[], alerts: SecurityAlert[]): number {
    let score = 100;

    // Deduct points based on event severity
    events.forEach(event => {
      switch (event.level) {
        case 'critical':
          score -= 10;
          break;
        case 'high':
          score -= 5;
          break;
        case 'medium':
          score -= 2;
          break;
        case 'low':
          score -= 1;
          break;
      }
    });

    // Deduct points for unresolved alerts
    const unresolvedAlerts = alerts.filter(a => a.status !== 'resolved').length;
    score -= unresolvedAlerts * 5;

    return Math.max(0, Math.min(100, score));
  }

  // ==================== Session Security ====================

  async createSecuritySession(userId: string): Promise<SecuritySession> {
    const session: Omit<SecuritySession, 'id' | 'created_at'> = {
      user_id: userId,
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
      is_active: true,
      last_activity: new Date().toISOString(),
      risk_score: await this.calculateUserRiskScore(userId),
      device_info: this.parseUserAgent(navigator.userAgent),
    };

    const { data, error } = await supabase
      .from('security_sessions')
      .insert(session)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    await supabase
      .from('security_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('id', sessionId);
  }

  private async calculateUserRiskScore(userId: string): Promise<number> {
    const recentEvents = await this.getEvents(undefined, 50);
    const userEvents = recentEvents.filter(e => e.user_id === userId);

    let riskScore = 0;
    userEvents.forEach(event => {
      switch (event.level) {
        case 'critical': riskScore += 25; break;
        case 'high': riskScore += 15; break;
        case 'medium': riskScore += 10; break;
        case 'low': riskScore += 5; break;
      }
    });

    return Math.min(100, riskScore);
  }

  // ==================== Audit Logging ====================

  async logAuditEvent(
    action: string,
    resourceType: string,
    resourceId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    const user = await supabase.auth.getUser();
    const auditLog: Omit<SecurityAuditLog, 'id' | 'timestamp'> = {
      user_id: user.data.user?.id,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: await this.getClientIP(),
      user_agent: navigator.userAgent,
    };

    await supabase
      .from('security_audit_logs')
      .insert(auditLog);
  }

  // ==================== Vulnerability Management ====================

  async createVulnerabilityReport(report: Omit<VulnerabilityReport, 'id' | 'detected_at'>): Promise<VulnerabilityReport> {
    const { data, error } = await supabase
      .from('vulnerability_reports')
      .insert({
        ...report,
        status: 'new',
      })
      .select()
      .single();

    if (error) throw error;

    await this.recordEvent({
      type: 'vulnerability_detected',
      level: report.severity,
      title: 'Vulnerability Detected',
      description: report.description,
      metadata: { 
        component: report.affected_component, 
        cve_id: report.cve_id,
        cvss_score: report.cvss_score,
      },
    });

    return data;
  }

  // ==================== Utility Methods ====================

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  private parseUserAgent(userAgent: string): SecuritySession['device_info'] {
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const os = this.extractOS(userAgent);
    const browser = this.extractBrowser(userAgent);

    return { os, browser, is_mobile: isMobile };
  }

  private extractOS(userAgent: string): string {
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private async sendSecurityNotification(alert: SecurityAlert): Promise<void> {
    // Implementation would depend on notification system
    // This could send emails, Slack messages, push notifications, etc.
    console.warn('HIGH PRIORITY SECURITY ALERT:', alert);
  }
}

export const securityService = SecurityService.getInstance();
