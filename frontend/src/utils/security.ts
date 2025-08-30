/**
 * Frontend Security Utilities
 * Provides XSS protection, input sanitization, and secure API handling
 */

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize HTML content (for display purposes only)
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.textContent = html; // This automatically escapes HTML
  return temp.innerHTML;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate URL format and ensure it's safe
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

/**
 * Generate a secure random string (for CSRF tokens, etc.)
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate that a string only contains allowed characters
 */
export function validateAllowedChars(input: string, pattern: RegExp): boolean {
  return pattern.test(input);
}

/**
 * Rate limiting helper for client-side
 */
export class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  /**
   * Check if request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => 
      now - timestamp < this.windowMs
    );
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }
}

/**
 * Secure API request wrapper
 */
export async function secureApiRequest(
  url: string, 
  options: RequestInit = {},
  token?: string
): Promise<Response> {
  // Validate URL
  if (!isValidUrl(url)) {
    throw new Error('Invalid URL provided');
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };
  
  // Add authentication if token provided
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // Add CSRF protection header
  headers['X-Requested-With'] = 'XMLHttpRequest';
  
  const secureOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'same-origin', // Don't send cookies to other origins
  };
  
  try {
    const response = await fetch(url, secureOptions);
    
    // Check for security-related errors
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    if (response.status === 403) {
      throw new Error('Access forbidden. Check your permissions.');
    }
    
    return response;
  } catch (error) {
    // Don't expose internal errors
    if (error instanceof Error) {
      // Log for debugging but don't expose to user
      console.error('API request failed:', error);
      throw new Error('Request failed. Please try again.');
    }
    throw error;
  }
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/png', 
    'image/gif',
    'application/pdf',
    'text/plain',
    'application/json'
  ];
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large (max 10MB)' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Check for suspicious file names
  if (/[<>:"|?*]/.test(file.name)) {
    return { valid: false, error: 'Invalid characters in filename' };
  }
  
  return { valid: true };
}

/**
 * Secure local storage wrapper
 */
export class SecureStorage {
  private static encrypt(data: string): string {
    // Simple base64 encoding (not cryptographically secure, but obfuscated)
    // In production, use proper encryption
    return btoa(data);
  }
  
  private static decrypt(data: string): string {
    try {
      return atob(data);
    } catch {
      return '';
    }
  }
  
  static setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, this.encrypt(value));
    } catch (error) {
      console.error('Failed to store item:', error);
    }
  }
  
  static getItem(key: string): string | null {
    try {
      const item = localStorage.getItem(key);
      return item ? this.decrypt(item) : null;
    } catch (error) {
      console.error('Failed to retrieve item:', error);
      return null;
    }
  }
  
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }
}

/**
 * Input validation schemas
 */
export const ValidationPatterns = {
  NAME: /^[a-zA-Z\s]{2,100}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/,
  PHONE: /^\+?[\d\s\-()]{10,15}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  NUMERIC: /^\d+$/,
  PROJECT_NAME: /^[a-zA-Z0-9\s\-_]{1,200}$/,
} as const;

/**
 * Security event logger for frontend
 */
export class SecurityEventLogger {
  private static events: Array<{
    type: string;
    timestamp: Date;
    details: Record<string, unknown>;
  }> = [];
  
  static logEvent(type: string, details: Record<string, unknown> = {}): void {
    this.events.push({
      type,
      timestamp: new Date(),
      details: {
        ...details,
        userAgent: navigator.userAgent,
        url: window.location.href,
      }
    });
    
    // Keep only last 100 events to prevent memory leaks
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
    
    // Log suspicious events
    if (['xss_attempt', 'invalid_input', 'unauthorized_access'].includes(type)) {
      console.warn(`Security event: ${type}`, details);
    }
  }
  
  static getEvents(): typeof SecurityEventLogger.events {
    return [...this.events];
  }
  
  static clearEvents(): void {
    this.events = [];
  }
}

/**
 * Content Security Policy violation reporter
 */
export function setupCSPReporting(): void {
  document.addEventListener('securitypolicyviolation', (event) => {
    SecurityEventLogger.logEvent('csp_violation', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
    });
    
    // In production, you might want to send this to your security service
    console.error('CSP Violation:', event);
  });
}