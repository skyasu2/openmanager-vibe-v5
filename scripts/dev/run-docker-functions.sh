#!/bin/bash
# run-docker-functions.sh
# 🐳 Run Cloud Run services locally using Docker
# Migrated from Cloud Functions to Cloud Run (2025-12-08)

set -e

# Directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$SCRIPT_DIR/../.."
FUNCTIONS_DIR="$PROJECT_ROOT/gcp-functions"

show_help() {
    echo "🐳 Cloud Run Services - Local Docker Environment"
    echo "================================================="
    echo ""
    echo "Usage: $0 [COMMAND] [SERVICE]"
    echo ""
    echo "Commands:"
    echo "  up        Start services (default)"
    echo "  build     Build and start services"
    echo "  down      Stop and remove services"
    echo "  logs      Show logs (optionally for specific service)"
    echo "  status    Show service status"
    echo "  help      Show this help message"
    echo ""
    echo "Services (Flask + Gunicorn, Cloud Run compatible):"

    echo "  enhanced-korean-nlp     Port 8081 - Korean NLP Processing"
    echo "  unified-ai-processor    Port 8082 - AI Orchestration"
    echo ""
    echo "Examples:"
    echo "  $0                          # Start all services"
    echo "  $0 build                    # Build and start all services"

    echo "  $0 logs enhanced-korean-nlp # Show logs for NLP service"
    echo "  $0 down                     # Stop all services"
    echo ""
    echo "Endpoints (after startup):"

    echo "  http://localhost:8081  - enhanced-korean-nlp"
    echo "  http://localhost:8082  - unified-ai-processor"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "❌ Docker is not running. Please start Docker Desktop first."
        if grep -q Microsoft /proc/version; then
            echo "💡 WSL detected: Ensure 'WSL Integration' is enabled in Docker Desktop settings."
        fi
        exit 1
    fi
}

check_wsl() {
    if grep -q Microsoft /proc/version; then
        echo "🐧 Running in WSL environment"
    fi
}

cd "$FUNCTIONS_DIR"

case "${1:-up}" in
    help|-h|--help)
        show_help
        exit 0
        ;;
    up)
        check_docker
        echo "🚀 Starting Cloud Run services..."
        if [ -n "$2" ]; then
            echo "📍 Service: $2"
            docker-compose -f docker-compose.dev.yml up "$2"
        else
            echo "📍 All services starting..."

            echo "  - enhanced-korean-nlp:    http://localhost:8081"
            echo "  - unified-ai-processor:   http://localhost:8082"
            docker-compose -f docker-compose.dev.yml up
        fi
        ;;
    build)
        check_docker
        echo "🔨 Building and starting Cloud Run services..."
        if [ -n "$2" ]; then
            echo "📍 Service: $2"
            docker-compose -f docker-compose.dev.yml up --build "$2"
        else
            echo "📍 Building all services..."
            docker-compose -f docker-compose.dev.yml up --build
        fi
        ;;
    down)
        check_docker
        echo "🛑 Stopping Cloud Run services..."
        docker-compose -f docker-compose.dev.yml down
        ;;
    logs)
        check_docker
        if [ -n "$2" ]; then
            docker-compose -f docker-compose.dev.yml logs -f "$2"
        else
            docker-compose -f docker-compose.dev.yml logs -f
        fi
        ;;
    status)
        check_docker
        echo "📊 Cloud Run Services Status:"
        docker-compose -f docker-compose.dev.yml ps
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_help
        exit 1
        ;;
esac
