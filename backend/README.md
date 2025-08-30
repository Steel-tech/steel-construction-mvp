# Steel Construction MVP - Backend

A secure Node.js/Express API server for the Steel Construction Management System with JWT authentication, rate limiting, and comprehensive data validation.

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Generate a secure JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   # Copy the output to JWT_SECRET in .env
   ```

### Running the Application

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

**Testing:**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
PORT=5001
JWT_SECRET=your_64_character_hex_secret_here
NODE_ENV=development
```

### Environment Variable Details

- `PORT`: Server port (default: 5000)
- `JWT_SECRET`: **Required** - Must be a secure 64-character hexadecimal string in production
- `NODE_ENV`: Environment mode (`development`, `production`, `test`)

### Security Requirements

In production, the JWT_SECRET must:
- Be at least 64 characters long
- Be a hexadecimal string (only contain 0-9, a-f, A-F)
- Be cryptographically secure (generate with `crypto.randomBytes()`)

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Projects (Authentication Required)
- `GET /api/projects` - Get all projects for authenticated user
- `POST /api/projects` - Create new project

### Materials (Authentication Required)
- `GET /api/materials` - Get all materials for authenticated user
- `POST /api/materials` - Create new material

### Project Progress (Authentication Required)
- `GET /api/projects/:projectId/progress` - Get project progress
- `POST /api/projects/:projectId/progress` - Update project progress

## API Documentation

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Request/Response Format

**Registration:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "username": "user123",
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "user123",
  "password": "securePassword123"
}
```

**Create Project:**
```bash
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Project Name",
  "description": "Project Description",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "budget": 100000
}
```

## Security Features

- **Helmet.js** - Security headers and CSP
- **Rate Limiting** - General (100 req/15min) and Auth (5 req/15min)
- **Input Validation** - express-validator for all inputs
- **Password Hashing** - bcrypt with proper salt rounds
- **JWT Authentication** - Secure token-based auth
- **SQL Injection Protection** - Parameterized queries
- **CORS Configuration** - Controlled cross-origin requests

## Database

Uses SQLite3 with the following tables:
- `users` - User accounts and authentication
- `projects` - Construction projects
- `materials` - Construction materials
- `project_progress` - Project progress tracking

## Development

### Project Structure
```
backend/
├── server.js          # Main application file
├── package.json       # Dependencies and scripts
├── jest.config.js     # Test configuration
├── .env              # Environment variables (not in git)
├── tests/            # Test files
│   ├── auth.test.js
│   ├── security.test.js
│   └── setup.js
└── README.md         # This file
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Testing

The backend includes comprehensive tests for:
- Authentication endpoints
- Security middleware
- Input validation
- Error handling

Tests are located in the `tests/` directory and use Jest + Supertest.

## Production Deployment

1. Set `NODE_ENV=production`
2. Generate a secure JWT_SECRET (64-char hex)
3. Configure appropriate PORT
4. Ensure database is properly initialized
5. Run `npm start`

### Health Check

Monitor the `/api/health` endpoint for service availability:

```bash
curl http://localhost:5001/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-08-30T..."
}
```

## Troubleshooting

**Common Issues:**

1. **JWT_SECRET Error**: Ensure JWT_SECRET is set and meets security requirements
2. **Port Already in Use**: Change PORT in .env or kill process using the port
3. **Database Issues**: Check file permissions for SQLite database file
4. **Test Failures**: Ensure NODE_ENV=test is set when running tests

For more help, check the application logs or contact the development team.