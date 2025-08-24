#!/bin/bash

# ==============================================
# RankHub v1 - Deploy Script for Coolify
# ==============================================
# This script helps automate the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}===============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if .env file exists
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env file not found!"
        print_info "Please copy .env.example to .env and configure your variables"
        print_info "cp .env.example .env"
        exit 1
    fi
    print_success ".env file found"
}

# Validate environment variables
validate_env_vars() {
    print_header "Validating Environment Variables"
    
    required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY")
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env; then
            value=$(grep "^${var}=" .env | cut -d '=' -f2)
            if [ -n "$value" ] && [ "$value" != "your_value_here" ]; then
                print_success "$var is configured"
            else
                print_error "$var is not properly configured in .env"
                exit 1
            fi
        else
            print_error "$var is missing from .env file"
            exit 1
        fi
    done
}

# Run linting
run_lint() {
    print_header "Running Linting"
    if npm run lint; then
        print_success "Linting passed"
    else
        print_warning "Linting failed, attempting to fix..."
        npm run lint:fix
        print_info "Please review the changes and commit them"
    fi
}

# Run type checking
run_type_check() {
    print_header "Running Type Check"
    if npm run type-check; then
        print_success "Type checking passed"
    else
        print_error "Type checking failed"
        exit 1
    fi
}

# Build the application
build_app() {
    print_header "Building Application"
    if npm run build:prod; then
        print_success "Build completed successfully"
    else
        print_error "Build failed"
        exit 1
    fi
}

# Test Docker build
test_docker_build() {
    print_header "Testing Docker Build"
    if docker build -t rankhub-test .; then
        print_success "Docker build successful"
        # Clean up test image
        docker rmi rankhub-test
    else
        print_error "Docker build failed"
        exit 1
    fi
}

# Commit and push changes
commit_and_push() {
    print_header "Committing and Pushing Changes"
    
    # Check if there are changes to commit
    if git diff --quiet && git diff --staged --quiet; then
        print_info "No changes to commit"
    else
        print_info "Staging all changes..."
        git add .
        
        echo -n "Enter commit message (or press Enter for default): "
        read commit_message
        
        if [ -z "$commit_message" ]; then
            commit_message="Deploy: Update RankHub v1 - $(date '+%Y-%m-%d %H:%M:%S')"
        fi
        
        git commit -m "$commit_message"
        print_success "Changes committed"
    fi
    
    # Push to remote
    current_branch=$(git branch --show-current)
    print_info "Pushing to origin/$current_branch..."
    
    if git push origin "$current_branch"; then
        print_success "Changes pushed to remote repository"
    else
        print_error "Failed to push changes"
        exit 1
    fi
}

# Display deployment checklist
show_deployment_checklist() {
    print_header "Deployment Checklist for Coolify"
    echo -e "${YELLOW}Please ensure the following are configured in Coolify:${NC}"
    echo ""
    echo "📋 Environment Variables:"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "   - VITE_APP_TITLE"
    echo "   - VITE_APP_DESCRIPTION"
    echo "   - VITE_APP_URL"
    echo "   - NODE_ENV=production"
    echo ""
    echo "🔧 Build Settings:"
    echo "   - Build Command: npm run build"
    echo "   - Start Command: nginx -g 'daemon off;'"
    echo "   - Port: 80"
    echo "   - Health Check Path: /health"
    echo ""
    echo "🌐 Domain & SSL:"
    echo "   - Configure your custom domain"
    echo "   - Enable SSL certificate"
    echo "   - Update VITE_APP_URL with your domain"
    echo ""
    echo "🔒 Supabase Configuration:"
    echo "   - Add your domain to CORS origins"
    echo "   - Verify RLS policies are active"
    echo "   - Test database connectivity"
    echo ""
}

# Main deployment process
main() {
    print_header "RankHub v1 - Pre-Deploy Validation"
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_warning "Docker is not installed. Skipping Docker build test."
        SKIP_DOCKER=true
    fi
    
    # Run all checks
    check_env_file
    validate_env_vars
    
    print_info "Installing dependencies..."
    npm ci
    
    run_lint
    run_type_check
    build_app
    
    if [ "$SKIP_DOCKER" != true ]; then
        test_docker_build
    fi
    
    # Ask if user wants to commit and push
    echo ""
    echo -n "Do you want to commit and push changes? (y/N): "
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        commit_and_push
    fi
    
    print_success "Pre-deploy validation completed successfully!"
    echo ""
    show_deployment_checklist
    
    print_success "Your application is ready for deployment to Coolify!"
    print_info "Repository: https://github.com/smartexia/rankhub-esports-v1.git"
    print_info "Branch: $(git branch --show-current)"
}

# Run main function
main "$@"