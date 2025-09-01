# 🚀 Load Testing Guide - Steel Construction MVP

## Overview

This guide provides comprehensive load testing procedures to validate the performance, scalability, and reliability of the Steel Construction MVP before production deployment.

## Quick Start

### Install Artillery
```bash
npm install -g artillery
```

### Run Tests
```bash
# Quick smoke test
cd load-testing
./run-tests.sh smoke

# Standard load test
./run-tests.sh load

# Stress test
./run-tests.sh stress
```

## Test Types

### 1. 🚬 Smoke Test
**Purpose**: Quick validation that the system is running  
**Duration**: 10 seconds  
**Load**: 1 user/second  
**Use Case**: CI/CD pipeline, pre-deployment check

```bash
./run-tests.sh smoke
```

### 2. 📊 Load Test
**Purpose**: Test normal expected load  
**Duration**: 5 minutes  
**Load**: Gradual ramp from 1 to 10 users/second  
**Use Case**: Validate normal operation capacity

```bash
./run-tests.sh load
```

### 3. 💪 Stress Test
**Purpose**: Find breaking point  
**Duration**: 4 minutes  
**Load**: Ramp up to 100 users/second  
**Use Case**: Identify system limits

```bash
./run-tests.sh stress
```

### 4. ⚡ Spike Test
**Purpose**: Test sudden traffic spike handling  
**Duration**: 70 seconds  
**Load**: Normal → 100 users/second spike → Normal  
**Use Case**: Validate spike resilience

```bash
./run-tests.sh spike
```

### 5. ⏱️ Endurance Test
**Purpose**: Test sustained load over time  
**Duration**: 10 minutes  
**Load**: Steady 10 users/second  
**Use Case**: Memory leak detection, stability

```bash
./run-tests.sh endurance
```

## Performance Targets

### Response Time Goals
- **95th percentile**: < 500ms
- **99th percentile**: < 1000ms
- **Maximum**: < 3000ms

### Throughput Goals
- **Minimum**: 100 requests/second
- **Target**: 500 requests/second
- **Stretch**: 1000 requests/second

### Error Rate Goals
- **5xx errors**: < 0.1%
- **4xx errors**: < 1%
- **Timeout rate**: < 0.01%

## Test Scenarios

### Health Check Scenario (20% weight)
- GET /health
- GET /health/ready
- Validates basic availability

### Authentication Flow (10% weight)
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- Tests auth system under load

### API Operations (30% weight)
- GET /api/v1/projects
- POST /api/v1/projects
- GET /api/v1/projects/:id
- Tests CRUD operations

### Mixed Operations (40% weight)
- Combination of all endpoints
- Simulates real-world usage

## Running Custom Tests

### Create Custom Config
```yaml
# custom-test.yml
config:
  target: "http://localhost:5001"
  phases:
    - duration: 60
      arrivalRate: 20
      
scenarios:
  - name: "Custom Test"
    flow:
      - get:
          url: "/api/v1/projects"
```

### Run Custom Test
```bash
./run-tests.sh custom html custom-test.yml
```

## Interpreting Results

### Key Metrics

#### Response Times
```
Summary report @ 15:30:00
--------------------------------
http.response_time:
  min: ......................................... 5
  max: ......................................... 245
  median: ...................................... 15
  p95: ......................................... 43
  p99: ......................................... 87
```

**Good**: p95 < 500ms, p99 < 1000ms  
**Warning**: p95 > 500ms  
**Critical**: p95 > 1000ms

#### Request Rate
```
http.request_rate: ............................ 50/sec
http.requests: ................................ 3000
```

**Target**: Match or exceed expected production load

#### Error Rate
```
http.codes.200: ............................... 2970
http.codes.401: ............................... 25
http.codes.500: ............................... 5
```

**Good**: 5xx errors < 0.1%  
**Warning**: 5xx errors > 0.5%  
**Critical**: 5xx errors > 1%

## Pre-Production Checklist

### 1. Database Performance
```bash
# Check slow queries
sqlite3 database/steel_construction.db "
SELECT sql, COUNT(*) as count 
FROM sqlite_stat1 
GROUP BY sql 
ORDER BY count DESC;"

# Analyze database
sqlite3 database/steel_construction.db "ANALYZE;"
```

### 2. Server Resources
```bash
# Monitor during load test
htop  # CPU and memory
iotop # Disk I/O
iftop # Network I/O
```

### 3. Application Metrics
```bash
# Check PM2 metrics
pm2 monit

# View logs
pm2 logs --lines 100
```

## Performance Optimization

### Quick Wins
1. **Enable compression**: Already configured ✅
2. **Add caching headers**: Configure in Nginx
3. **Database indexes**: Already created ✅
4. **Connection pooling**: Consider for high load

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_materials_type ON materials(type);

-- Vacuum database
VACUUM;
```

### Server Tuning
```bash
# Increase file descriptors
ulimit -n 65536

# Tune kernel parameters
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 8192" >> /etc/sysctl.conf
sysctl -p
```

### Node.js Optimization
```javascript
// Use cluster mode (already in PM2 config)
// Enable compression (already configured)
// Implement caching layer
// Use connection pooling
```

## Monitoring During Tests

### Real-time Monitoring
```bash
# Terminal 1: Run load test
./run-tests.sh load

# Terminal 2: Monitor server
pm2 monit

# Terminal 3: Watch logs
pm2 logs --lines 100

# Terminal 4: System resources
htop
```

### Key Indicators to Watch
- CPU usage (should stay < 80%)
- Memory usage (watch for leaks)
- Response times (should be consistent)
- Error rate (should be minimal)
- Database connections (shouldn't max out)

## Troubleshooting

### High Response Times
- Check database queries (add indexes)
- Enable query caching
- Optimize N+1 queries
- Add Redis caching layer

### High Error Rate
- Check rate limiting settings
- Increase connection pool size
- Review error logs
- Check database locks

### Memory Leaks
- Run endurance test
- Monitor memory over time
- Use heap snapshots
- Check for unclosed connections

### Connection Errors
- Increase ulimit
- Tune TCP settings
- Check firewall rules
- Review Nginx config

## CI/CD Integration

### GitHub Actions
```yaml
- name: Load Test
  run: |
    npm install -g artillery
    cd load-testing
    ./run-tests.sh smoke
```

### Pre-deployment Script
```bash
#!/bin/bash
# pre-deploy-test.sh

echo "Running pre-deployment tests..."

# Smoke test
./run-tests.sh smoke
if [ $? -ne 0 ]; then
  echo "Smoke test failed!"
  exit 1
fi

# Quick load test
./run-tests.sh load
if [ $? -ne 0 ]; then
  echo "Load test failed!"
  exit 1
fi

echo "All tests passed!"
```

## Production Load Testing

### ⚠️ WARNING
Never run stress/spike tests on production without warning!

### Safe Production Testing
1. Use read-only operations
2. Test during low-traffic periods
3. Start with minimal load
4. Have rollback plan ready
5. Monitor closely

### Production Test Config
```yaml
config:
  target: "https://api.production.com"
  phases:
    - duration: 60
      arrivalRate: 1  # Very light load
      
scenarios:
  - name: "Production Health"
    flow:
      - get:
          url: "/health"
```

## Report Generation

### HTML Reports
```bash
# Generate HTML report
./run-tests.sh load html

# Report location
reports/load_20240101_120000.html
```

### JSON Reports
```bash
# Generate JSON report
./run-tests.sh load json

# Parse with jq
cat reports/load_*.json | jq '.aggregate'
```

### Custom Metrics
```javascript
// In load-test-processor.js
ee.emit('counter', 'custom_metric', 1);
ee.emit('histogram', 'custom_timing', responseTime);
```

## Success Criteria

Before deploying to production, ensure:

✅ **Smoke Test**: 100% pass rate  
✅ **Load Test**: < 1% error rate  
✅ **Stress Test**: Graceful degradation  
✅ **Response Time**: p95 < 500ms  
✅ **Throughput**: > 100 req/sec  
✅ **No Memory Leaks**: Stable over 10 minutes  
✅ **Error Recovery**: System recovers from spikes  

## Next Steps

1. Run baseline tests
2. Document current performance
3. Set up monitoring alerts
4. Create performance budget
5. Schedule regular tests
6. Track performance over time

---

**Remember**: Load test regularly, not just before launch!