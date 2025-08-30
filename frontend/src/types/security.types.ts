export type SecurityEventType = 
  | 'auth_failed_login'
  | 'auth_successful_login'
  | 'auth_logout'
  | 'auth_session_expired'
  | 'auth_password_change'
  | 'auth_mfa_enabled'
  | 'auth_mfa_disabled'
  | 'access_denied'
  | 'permission_escalation'
  | 'data_access'
  | 'data_modification'
  | 'data_deletion'
  | 'api_rate_limit_exceeded'
  | 'suspicious_activity'
  | 'security_scan'
  | 'vulnerability_detected'
  | 'malicious_request'
  | 'xss_attempt'
  | 'sql_injection_attempt'
  | 'csrf_attempt'
  | 'brute_force_attempt'
  | 'account_lockout'
  | 'ip_blacklisted'
  | 'file_upload_rejected'
  | 'configuration_change';

export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';

export type SecurityStatus = 'active' | 'resolved' | 'investigating' | 'false_positive';

export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  level: SecurityLevel;
  status: SecurityStatus;
  title: string;
  description: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  resource?: string;
  method?: string;
  url?: string;
  project_id?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  type: 'rate_limit' | 'access_control' | 'content_filter' | 'behavioral' | 'vulnerability';
  enabled: boolean;
  severity: SecurityLevel;
  conditions: SecurityRuleCondition[];
  actions: SecurityRuleAction[];
  created_at: string;
  updated_at: string;
}

export interface SecurityRuleCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'matches_regex';
  value: string | number;
  case_sensitive?: boolean;
}

export interface SecurityRuleAction {
  type: 'block' | 'alert' | 'log' | 'rate_limit' | 'captcha' | 'mfa_required';
  parameters?: Record<string, unknown>;
}

export interface SecurityAlert {
  id: string;
  rule_id: string;
  event_id: string;
  title: string;
  description: string;
  level: SecurityLevel;
  status: 'new' | 'acknowledged' | 'investigating' | 'resolved';
  affected_user?: string;
  affected_resource?: string;
  recommended_actions: string[];
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
}

export interface SecurityMetrics {
  total_events: number;
  events_by_level: Record<SecurityLevel, number>;
  events_by_type: Record<SecurityEventType, number>;
  blocked_requests: number;
  failed_logins: number;
  suspicious_activities: number;
  vulnerabilities_detected: number;
  active_alerts: number;
  resolved_alerts: number;
  time_to_resolution_avg: number; // in minutes
  top_threat_sources: Array<{
    ip: string;
    country?: string;
    events: number;
  }>;
  security_score: number; // 0-100
}

export interface IPWhitelist {
  id: string;
  ip_address: string;
  description?: string;
  user_id?: string;
  project_id?: string;
  created_by: string;
  expires_at?: string;
  created_at: string;
}

export interface IPBlacklist {
  id: string;
  ip_address: string;
  reason: string;
  blocked_by: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SecuritySession {
  id: string;
  user_id: string;
  ip_address: string;
  user_agent: string;
  is_active: boolean;
  last_activity: string;
  created_at: string;
  risk_score: number;
  location?: {
    country: string;
    city: string;
    timezone: string;
  };
  device_info?: {
    os: string;
    browser: string;
    is_mobile: boolean;
  };
}

export interface SecurityAuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  project_id?: string;
  timestamp: string;
}

export interface VulnerabilityReport {
  id: string;
  type: 'dependency' | 'configuration' | 'code' | 'infrastructure';
  severity: SecurityLevel;
  title: string;
  description: string;
  affected_component: string;
  cve_id?: string;
  cvss_score?: number;
  remediation: string;
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved' | 'false_positive';
  detected_at: string;
  resolved_at?: string;
  assigned_to?: string;
}

export interface SecurityConfiguration {
  id: string;
  name: string;
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
    max_age_days: number;
    prevent_reuse_count: number;
  };
  session_policy: {
    max_duration_hours: number;
    idle_timeout_minutes: number;
    require_mfa_for_admin: boolean;
    allow_concurrent_sessions: boolean;
    max_concurrent_sessions: number;
  };
  rate_limiting: {
    login_attempts: {
      max_attempts: number;
      window_minutes: number;
      lockout_minutes: number;
    };
    api_requests: {
      requests_per_minute: number;
      burst_limit: number;
    };
  };
  content_security: {
    max_file_size_mb: number;
    allowed_file_types: string[];
    scan_uploads: boolean;
    block_suspicious_content: boolean;
  };
  monitoring: {
    log_all_requests: boolean;
    alert_on_failed_logins: number;
    alert_on_suspicious_activity: boolean;
    retention_days: number;
  };
  created_at: string;
  updated_at: string;
  updated_by: string;
}

// Security context for React components
export interface SecurityContextData {
  events: SecurityEvent[];
  alerts: SecurityAlert[];
  metrics: SecurityMetrics;
  configuration: SecurityConfiguration;
  isSecurityAdmin: boolean;
  loading: boolean;
  error?: string;
}

// Security provider props
export interface SecurityProviderProps {
  children: React.ReactNode;
  projectId?: string;
}

// API request/response types
export interface SecurityEventRequest {
  type: SecurityEventType;
  level: SecurityLevel;
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  resource?: string;
  method?: string;
  url?: string;
}

export interface SecurityRuleRequest {
  name: string;
  description: string;
  type: SecurityRule['type'];
  severity: SecurityLevel;
  conditions: SecurityRuleCondition[];
  actions: SecurityRuleAction[];
}

// Hook return types
export interface UseSecurityMonitor {
  recordEvent: (event: SecurityEventRequest) => Promise<void>;
  checkRule: (ruleName: string, context: Record<string, unknown>) => boolean;
  isBlocked: (ip: string) => boolean;
  getRiskScore: (userId: string) => number;
}
