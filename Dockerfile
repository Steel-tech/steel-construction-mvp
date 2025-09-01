# Multi-stage Dockerfile for Steel Construction MVP

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build the frontend
RUN npm run build

# ============================================
# Stage 2: Build Backend
# ============================================
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install production dependencies
RUN npm ci --only=production

# ============================================
# Stage 3: Production Image
# ============================================
FROM node:18-alpine

# Install PM2 globally
RUN npm install -g pm2

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy built frontend from stage 1
COPY --from=frontend-builder --chown=nodejs:nodejs /app/frontend/dist ./frontend/dist

# Copy backend from stage 2
COPY --from=backend-builder --chown=nodejs:nodejs /app/backend/node_modules ./backend/node_modules

# Copy backend source code
COPY --chown=nodejs:nodejs backend/ ./backend/

# Copy database schema
COPY --chown=nodejs:nodejs database/ ./database/

# Copy PM2 configuration
COPY --chown=nodejs:nodejs ecosystem.config.js ./

# Create necessary directories
RUN mkdir -p logs uploads && \
    chown -R nodejs:nodejs logs uploads

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})" || exit 1

# Start the application with PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]