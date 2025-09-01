#!/bin/bash

# Load Testing Script for Steel Construction MVP
# Prerequisites: npm install -g artillery

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:5001}"
TEST_TYPE="${1:-smoke}"
REPORT_FORMAT="${2:-html}"

echo -e "${GREEN}Steel Construction MVP - Load Testing${NC}"
echo "========================================="
echo "API URL: $API_URL"
echo "Test Type: $TEST_TYPE"
echo "Report Format: $REPORT_FORMAT"
echo ""

# Function to check if server is running
check_server() {
    echo -e "${YELLOW}Checking if server is running...${NC}"
    if curl -f -s "$API_URL/health" > /dev/null; then
        echo -e "${GREEN}✓ Server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not running at $API_URL${NC}"
        echo "Please start the server first: npm start"
        exit 1
    fi
}

# Function to run test
run_test() {
    local config_file=$1
    local test_name=$2
    local output_file="reports/${test_name}_$(date +%Y%m%d_%H%M%S)"
    
    mkdir -p reports
    
    echo -e "${YELLOW}Running $test_name test...${NC}"
    
    if [ "$REPORT_FORMAT" == "html" ]; then
        artillery run "$config_file" \
            --target "$API_URL" \
            --output "${output_file}.json"
        
        artillery report "${output_file}.json" \
            --output "${output_file}.html"
        
        echo -e "${GREEN}✓ Test complete. Report: ${output_file}.html${NC}"
        
        # Open report in browser (macOS)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "${output_file}.html"
        fi
    else
        artillery run "$config_file" \
            --target "$API_URL" \
            --output "${output_file}.json"
        
        echo -e "${GREEN}✓ Test complete. Report: ${output_file}.json${NC}"
    fi
}

# Check if artillery is installed
if ! command -v artillery &> /dev/null; then
    echo -e "${RED}Artillery is not installed.${NC}"
    echo "Install it with: npm install -g artillery"
    exit 1
fi

# Check server
check_server

# Run appropriate test based on type
case $TEST_TYPE in
    smoke)
        cat > temp-smoke-test.yml << EOF
config:
  target: "$API_URL"
  phases:
    - duration: 10
      arrivalRate: 1
      name: "Smoke Test"

scenarios:
  - name: "Basic Health Check"
    flow:
      - get:
          url: "/health"
          expect:
            - statusCode: 200
      - get:
          url: "/api/v1"
          expect:
            - statusCode: 200
EOF
        run_test "temp-smoke-test.yml" "smoke"
        rm temp-smoke-test.yml
        ;;
    
    load)
        run_test "artillery-config.yml" "load"
        ;;
    
    stress)
        cat > temp-stress-test.yml << EOF
config:
  target: "$API_URL"
  phases:
    - duration: 60
      arrivalRate: 10
      rampTo: 50
      name: "Stress Ramp Up"
    - duration: 120
      arrivalRate: 50
      name: "Sustained Stress"
    - duration: 60
      arrivalRate: 50
      rampTo: 100
      name: "Peak Stress"
  
  processor: "./load-test-processor.js"

scenarios:
  - name: "Stress Test"
    weight: 100
    flow:
      - get:
          url: "/health"
      - think: 1
      - get:
          url: "/api/v1/projects"
      - think: 1
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "stress@test.com"
            password: "StressTest@123"
EOF
        run_test "temp-stress-test.yml" "stress"
        rm temp-stress-test.yml
        ;;
    
    spike)
        cat > temp-spike-test.yml << EOF
config:
  target: "$API_URL"
  phases:
    - duration: 30
      arrivalRate: 5
      name: "Normal Load"
    - duration: 10
      arrivalRate: 100
      name: "Spike"
    - duration: 30
      arrivalRate: 5
      name: "Recovery"

scenarios:
  - name: "Spike Test"
    flow:
      - get:
          url: "/health"
      - get:
          url: "/api/v1"
EOF
        run_test "temp-spike-test.yml" "spike"
        rm temp-spike-test.yml
        ;;
    
    endurance)
        cat > temp-endurance-test.yml << EOF
config:
  target: "$API_URL"
  phases:
    - duration: 600
      arrivalRate: 10
      name: "10 Minute Endurance"
  
  processor: "./load-test-processor.js"

scenarios:
  - name: "Endurance Test"
    weight: 100
    flow:
      - get:
          url: "/health"
      - think: 5
      - get:
          url: "/api/v1"
      - think: 5
      - get:
          url: "/api/v1/projects"
EOF
        run_test "temp-endurance-test.yml" "endurance"
        rm temp-endurance-test.yml
        ;;
    
    custom)
        if [ -z "$3" ]; then
            echo -e "${RED}Please provide custom config file path${NC}"
            echo "Usage: ./run-tests.sh custom [html|json] path/to/config.yml"
            exit 1
        fi
        run_test "$3" "custom"
        ;;
    
    *)
        echo -e "${RED}Unknown test type: $TEST_TYPE${NC}"
        echo ""
        echo "Available test types:"
        echo "  smoke     - Quick smoke test (10 seconds, 1 user/sec)"
        echo "  load      - Standard load test (5 minutes, gradual ramp)"
        echo "  stress    - Stress test (4 minutes, up to 100 users/sec)"
        echo "  spike     - Spike test (70 seconds, sudden spike to 100 users/sec)"
        echo "  endurance - Endurance test (10 minutes, steady load)"
        echo "  custom    - Custom test with your config file"
        echo ""
        echo "Usage: ./run-tests.sh [test-type] [report-format]"
        echo "Example: ./run-tests.sh load html"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Load testing complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the report in the reports/ directory"
echo "2. Check server logs for any errors"
echo "3. Monitor system resources during tests"
echo "4. Adjust rate limits and server config based on results"