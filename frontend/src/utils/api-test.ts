/**
 * API Integration Test Utils
 * Use these functions to test the API integration
 */

import { apiService } from '../services/api.service';
import { projectsService } from '../services/projects.service';
import { materialsService } from '../services/materials.service';

export interface TestResult {
  test: string;
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

/**
 * Test health check endpoint
 */
export async function testHealthCheck(): Promise<TestResult> {
  try {
    const response = await apiService.healthCheck();
    
    if (response.error) {
      return {
        test: 'Health Check',
        success: false,
        message: 'Health check failed',
        error: response.error
      };
    }

    return {
      test: 'Health Check',
      success: true,
      message: 'API is healthy',
      data: response.data
    };
  } catch (error) {
    return {
      test: 'Health Check',
      success: false,
      message: 'Network error during health check',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test user registration
 */
export async function testUserRegistration(email: string = 'test@example.com', password: string = 'testpass123'): Promise<TestResult> {
  try {
    const response = await apiService.register({
      email,
      password,
      name: 'Test User',
      role: 'client'
    });

    if (response.error) {
      return {
        test: 'User Registration',
        success: false,
        message: 'Registration failed',
        error: response.error
      };
    }

    return {
      test: 'User Registration',
      success: true,
      message: 'User registered successfully',
      data: response.data
    };
  } catch (error) {
    return {
      test: 'User Registration',
      success: false,
      message: 'Network error during registration',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test user login
 */
export async function testUserLogin(email: string = 'test@example.com', password: string = 'testpass123'): Promise<TestResult> {
  try {
    const response = await apiService.login({
      email,
      password
    });

    if (response.error) {
      return {
        test: 'User Login',
        success: false,
        message: 'Login failed',
        error: response.error
      };
    }

    return {
      test: 'User Login',
      success: true,
      message: 'User logged in successfully',
      data: response.data
    };
  } catch (error) {
    return {
      test: 'User Login',
      success: false,
      message: 'Network error during login',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test projects endpoint (requires authentication)
 */
export async function testGetProjects(): Promise<TestResult> {
  try {
    const projects = await projectsService.getAll();

    return {
      test: 'Get Projects',
      success: true,
      message: `Retrieved ${projects.length} projects`,
      data: projects
    };
  } catch (error) {
    return {
      test: 'Get Projects',
      success: false,
      message: 'Failed to get projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test materials endpoint (requires authentication)
 */
export async function testGetMaterials(): Promise<TestResult> {
  try {
    const materials = await materialsService.getAll();

    return {
      test: 'Get Materials',
      success: true,
      message: `Retrieved ${materials.length} materials`,
      data: materials
    };
  } catch (error) {
    return {
      test: 'Get Materials',
      success: false,
      message: 'Failed to get materials',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run all tests
 */
export async function runAllTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test 1: Health check
  results.push(await testHealthCheck());
  
  // Test 2: User registration
  const regResult = await testUserRegistration();
  results.push(regResult);
  
  // Test 3: User login (only if registration was successful or user already exists)
  if (regResult.success || (regResult.error && regResult.error.includes('already exists'))) {
    const loginResult = await testUserLogin();
    results.push(loginResult);
    
    // Test 4 & 5: Authenticated endpoints (only if login successful)
    if (loginResult.success) {
      results.push(await testGetProjects());
      results.push(await testGetMaterials());
    }
  }
  
  return results;
}

/**
 * Log test results to console
 */
export function logTestResults(results: TestResult[]): void {
  console.log('\n=== API Integration Test Results ===\n');
  
  results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.test}`);
    console.log(`   Message: ${result.message}`);
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.data) {
      console.log(`   Data:`, result.data);
    }
    
    console.log('');
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`=== Summary: ${passed}/${total} tests passed ===\n`);
}