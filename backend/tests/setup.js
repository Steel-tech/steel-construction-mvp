const path = require('path');
const fs = require('fs');

// Setup test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-not-for-production';
process.env.PORT = '0'; // Use random available port

// Create test database path
const testDbPath = path.join(__dirname, '../test.db');

// Clean up test database before each test suite
beforeEach(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

// Clean up after all tests
afterAll(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});