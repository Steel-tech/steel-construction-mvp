#!/bin/bash

# Deployment Verification Script
# Tests all critical endpoints and configurations

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-http://localhost:5001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}     Steel Construction MVP - Deployment Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Track results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=$3
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_code, got $response)"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Function to test JSON response
test_json_endpoint() {
    local name=$1
    local url=$2
    local field=$3
    
    echo -n "Testing $name... "
    
    if response=$(curl -s "$url" 2>/dev/null) && echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); sys.exit(0 if '$field' in data else 1)" 2>/dev/null; then
        echo -e "${GREEN}✓ PASS${NC} (Valid JSON with '$field')"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Invalid JSON or missing '$field')"
        ((TESTS_FAILED++))
        return 1
    fi
}

echo -e "${YELLOW}1. Backend Health Checks${NC}"
echo "─────────────────────────────"
test_json_endpoint "Basic Health" "$API_URL/health" "status"
test_json_endpoint "Detailed Health" "$API_URL/health/detailed" "database"
test_json_endpoint "Ready Check" "$API_URL/health/ready" "ready"
test_json_endpoint "Live Check" "$API_URL/health/live" "alive"
echo ""

echo -e "${YELLOW}2. API Endpoints${NC}"
echo "─────────────────────────────"
test_endpoint "API Root" "$API_URL/" "200"
test_json_endpoint "API v1 Info" "$API_URL/api/v1" "version"
test_endpoint "Projects (401 expected)" "$API_URL/api/v1/projects" "401"
test_endpoint "Materials (401 expected)" "$API_URL/api/v1/materials" "401"
echo ""

echo -e "${YELLOW}3. Authentication Tests${NC}"
echo "─────────────────────────────"

# Test registration
echo -n "Testing Registration... "
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$(date +%s)@example.com\",\"password\":\"Test@123456\",\"name\":\"Test User\"}" \
    2>/dev/null)

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓ PASS${NC} (Token received)"
    ((TESTS_PASSED++))
    
    # Extract token for further tests
    TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null || echo "")
else
    echo -e "${RED}✗ FAIL${NC} (No token in response)"
    ((TESTS_FAILED++))
    TOKEN=""
fi

# Test login
echo -n "Testing Login... "
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test@example.com\",\"password\":\"Test@123456\"}" \
    2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q "token\|Invalid"; then
    echo -e "${GREEN}✓ PASS${NC} (Endpoint working)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Unexpected response)"
    ((TESTS_FAILED++))
fi
echo ""

echo -e "${YELLOW}4. Security Headers${NC}"
echo "─────────────────────────────"

# Check security headers
echo -n "Testing Security Headers... "
HEADERS=$(curl -s -I "$API_URL/health" 2>/dev/null)

SECURITY_HEADERS=(
    "X-Content-Type-Options: nosniff"
    "X-Frame-Options: SAMEORIGIN"
    "X-XSS-Protection: 1; mode=block"
)

HEADERS_OK=true
for header in "${SECURITY_HEADERS[@]}"; do
    if ! echo "$HEADERS" | grep -q "$header"; then
        HEADERS_OK=false
        break
    fi
done

if $HEADERS_OK; then
    echo -e "${GREEN}✓ PASS${NC} (All security headers present)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} (Missing security headers)"
    ((TESTS_FAILED++))
fi
echo ""

echo -e "${YELLOW}5. Environment Configuration${NC}"
echo "─────────────────────────────"

# Check backend env
echo -n "Checking Backend .env... "
if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ MISSING${NC}"
    ((TESTS_FAILED++))
fi

echo -n "Checking Frontend .env... "
if [ -f "frontend/.env" ] || [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ MISSING${NC}"
    ((TESTS_FAILED++))
fi

echo -n "Checking Production Configs... "
if [ -f "backend/.env.production" ] && [ -f "frontend/.env.production" ]; then
    echo -e "${GREEN}✓ EXISTS${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠ NOT FOUND${NC} (Run ./setup-production.sh)"
    ((TESTS_FAILED++))
fi
echo ""

echo -e "${YELLOW}6. Deployment Files${NC}"
echo "─────────────────────────────"

FILES_TO_CHECK=(
    "docker-compose.yml"
    "Dockerfile"
    "ecosystem.config.js"
    "nginx.conf"
    "load-testing/artillery-config.yml"
)

for file in "${FILES_TO_CHECK[@]}"; do
    echo -n "Checking $file... "
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ EXISTS${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ MISSING${NC}"
        ((TESTS_FAILED++))
    fi
done
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    TEST SUMMARY${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED - READY FOR DEPLOYMENT!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run ./setup-production.sh to configure production"
    echo "2. Set up SSL certificates"
    echo "3. Deploy using Docker or PM2"
    exit 0
else
    echo -e "${YELLOW}⚠️  SOME TESTS FAILED - REVIEW BEFORE DEPLOYMENT${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Ensure backend server is running: cd backend && npm start"
    echo "- Check environment variables are set correctly"
    echo "- Run npm install in both backend and frontend"
    echo "- Review error logs for specific issues"
    exit 1
fi