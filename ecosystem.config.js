/**
 * PM2 Configuration File
 * For production process management
 * 
 * Usage:
 * pm2 start ecosystem.config.js --env production
 * pm2 reload ecosystem.config.js
 * pm2 stop all
 */

module.exports = {
  apps: [
    {
      // Backend API Server
      name: 'steel-api',
      script: './backend/server-new.js',
      instances: process.env.PM2_INSTANCES || 'max',
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      
      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced features
      min_uptime: '10s',
      listen_timeout: 3000,
      kill_timeout: 5000,
      wait_ready: true,
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000,
      
      // Monitoring
      monitoring: true,
      
      // Graceful reload
      shutdown_with_message: true,
      
      // Health check
      health_check: {
        interval: 30000,
        url: 'http://localhost:5001/health',
        max_consecutive_failures: 3
      }
    },
    {
      // Frontend Dev Server (for development only)
      name: 'steel-frontend-dev',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      watch: false,
      interpreter: 'none',
      env: {
        NODE_ENV: 'development'
      },
      // Only run in development
      min_uptime: '10s',
      max_restarts: 3
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'your-server.com',
      ref: 'origin/main',
      repo: 'git@github.com:Steel-tech/steel-construction-mvp.git',
      path: '/var/www/steel-construction',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      env: {
        NODE_ENV: 'production'
      }
    },
    staging: {
      user: 'deploy',
      host: 'staging.your-server.com',
      ref: 'origin/develop',
      repo: 'git@github.com:Steel-tech/steel-construction-mvp.git',
      path: '/var/www/steel-construction-staging',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};