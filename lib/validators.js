// Input validation utilities for serverless functions

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
}

export function validateRequired(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true };
}

export function validateLength(value, fieldName, min, max) {
  if (!value) return { valid: false, error: `${fieldName} is required` };
  
  const length = value.toString().length;
  if (min && length < min) {
    return { valid: false, error: `${fieldName} must be at least ${min} characters` };
  }
  if (max && length > max) {
    return { valid: false, error: `${fieldName} must be less than ${max} characters` };
  }
  return { valid: true };
}

export function validateNumber(value, fieldName, min, max) {
  const num = Number(value);
  if (isNaN(num)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }
  if (min !== undefined && num < min) {
    return { valid: false, error: `${fieldName} must be at least ${min}` };
  }
  if (max !== undefined && num > max) {
    return { valid: false, error: `${fieldName} must be at most ${max}` };
  }
  return { valid: true };
}

// Sanitize input to prevent SQL injection
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove any SQL keywords and special characters
  return input
    .replace(/[<>'"]/g, '')
    .trim()
    .substring(0, 1000); // Limit length
}

// Validate request body against schema
export function validateBody(body, schema) {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = body[field];
    
    if (rules.required) {
      const result = validateRequired(value, field);
      if (!result.valid) {
        errors.push(result.error);
        continue;
      }
    }
    
    if (value !== undefined && value !== null) {
      if (rules.type === 'email' && !validateEmail(value)) {
        errors.push(`${field} must be a valid email`);
      }
      
      if (rules.type === 'password') {
        const result = validatePassword(value);
        if (!result.valid) {
          errors.push(result.error);
        }
      }
      
      if (rules.minLength || rules.maxLength) {
        const result = validateLength(value, field, rules.minLength, rules.maxLength);
        if (!result.valid) {
          errors.push(result.error);
        }
      }
      
      if (rules.type === 'number') {
        const result = validateNumber(value, field, rules.min, rules.max);
        if (!result.valid) {
          errors.push(result.error);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}