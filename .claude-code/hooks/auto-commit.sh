#!/bin/bash

# Auto-commit hook for Claude Code
# Automatically commits successful code changes to GitHub

# Configuration
COMMIT_PREFIX="[claude-code]"
MAX_FILES_PER_COMMIT=10
EXCLUDE_PATTERNS=(".env" ".env.local" "*.log" "node_modules/" ".DS_Store")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file should be excluded
should_exclude() {
    local file=$1
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        if [[ "$file" == *"$pattern"* ]]; then
            return 0
        fi
    done
    return 1
}

# Function to generate commit message
generate_commit_message() {
    local files=("$@")
    local file_count=${#files[@]}
    
    # Analyze file changes to determine commit type
    local has_feat=false
    local has_fix=false
    local has_test=false
    local has_docs=false
    local has_refactor=false
    
    for file in "${files[@]}"; do
        if [[ "$file" == *"test"* ]] || [[ "$file" == *"spec"* ]]; then
            has_test=true
        elif [[ "$file" == *"README"* ]] || [[ "$file" == *"docs"* ]]; then
            has_docs=true
        elif [[ "$file" == *"fix"* ]] || [[ "$file" == *"bug"* ]]; then
            has_fix=true
        elif [[ "$file" == *"components"* ]] || [[ "$file" == *"pages"* ]]; then
            has_feat=true
        fi
    done
    
    # Determine commit type
    local commit_type="chore"
    local commit_scope=""
    
    if $has_test; then
        commit_type="test"
    elif $has_docs; then
        commit_type="docs"
    elif $has_fix; then
        commit_type="fix"
    elif $has_feat; then
        commit_type="feat"
    fi
    
    # Determine scope from directory
    if [[ "${files[0]}" == *"components"* ]]; then
        commit_scope="components"
    elif [[ "${files[0]}" == *"services"* ]]; then
        commit_scope="services"
    elif [[ "${files[0]}" == *"types"* ]]; then
        commit_scope="types"
    elif [[ "${files[0]}" == *"production"* ]]; then
        commit_scope="production"
    elif [[ "${files[0]}" == *"quality"* ]]; then
        commit_scope="quality"
    fi
    
    # Build commit message
    local message="$commit_type"
    if [ ! -z "$commit_scope" ]; then
        message="$message($commit_scope)"
    fi
    message="$message: "
    
    # Add description based on files
    if [ $file_count -eq 1 ]; then
        local filename=$(basename "${files[0]}")
        message="$message Update $filename"
    else
        message="$message Update $file_count files"
    fi
    
    echo "$COMMIT_PREFIX $message"
}

# Function to run pre-commit checks
run_checks() {
    echo -e "${YELLOW}Running pre-commit checks...${NC}"
    
    # Check TypeScript compilation
    if [ -f "tsconfig.json" ]; then
        echo "Checking TypeScript..."
        npx tsc --noEmit
        if [ $? -ne 0 ]; then
            echo -e "${RED}TypeScript compilation failed${NC}"
            return 1
        fi
    fi
    
    # Check ESLint
    if [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ]; then
        echo "Running ESLint..."
        npx eslint src --max-warnings 10
        if [ $? -ne 0 ]; then
            echo -e "${RED}ESLint check failed${NC}"
            return 1
        fi
    fi
    
    echo -e "${GREEN}All checks passed!${NC}"
    return 0
}

# Main execution
main() {
    # Get modified files
    local modified_files=($(git diff --name-only))
    local staged_files=($(git diff --cached --name-only))
    
    # Combine and deduplicate
    local all_files=()
    for file in "${modified_files[@]}" "${staged_files[@]}"; do
        if ! should_exclude "$file"; then
            all_files+=("$file")
        fi
    done
    
    # Remove duplicates
    all_files=($(echo "${all_files[@]}" | tr ' ' '\n' | sort -u | tr '\n' ' '))
    
    # Check if there are files to commit
    if [ ${#all_files[@]} -eq 0 ]; then
        echo "No files to commit"
        exit 0
    fi
    
    echo -e "${YELLOW}Found ${#all_files[@]} file(s) to commit${NC}"
    
    # Run checks
    run_checks
    if [ $? -ne 0 ]; then
        echo -e "${RED}Pre-commit checks failed. Skipping commit.${NC}"
        exit 1
    fi
    
    # Stage files
    for file in "${all_files[@]}"; do
        git add "$file"
        echo "Staged: $file"
    done
    
    # Generate commit message
    local commit_msg=$(generate_commit_message "${all_files[@]}")
    
    # Create commit
    git commit -m "$commit_msg"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Successfully committed with message: $commit_msg${NC}"
        
        # Optional: Push to remote (uncomment if desired)
        # echo "Pushing to remote..."
        # git push
    else
        echo -e "${RED}Commit failed${NC}"
        exit 1
    fi
}

# Run main function
main "$@"