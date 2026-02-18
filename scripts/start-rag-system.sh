#!/bin/bash
# Quick Start Script for Banking Knowledge Base RAG System

set -e

echo "================================================"
echo "Banking Knowledge Base RAG System - Quick Start"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "Checking prerequisites..."
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✅ Docker installed${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose installed${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 22+: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js installed ($(node --version))${NC}"

echo ""
echo "================================================"
echo "Step 1: Configuration"
echo "================================================"
echo ""

# RAG Service configuration
cd services/rag-service

if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit services/rag-service/.env and add your API keys:${NC}"
    echo "   - OPENAI_API_KEY"
    echo "   - PINECONE_API_KEY (if using Pinecone)"
    echo ""
    echo "Press Enter when ready to continue..."
    read
fi

echo ""
echo "================================================"
echo "Step 2: Start Services"
echo "================================================"
echo ""

echo "Starting RAG service with Docker Compose..."
docker-compose up -d

echo ""
echo "Waiting for services to be ready..."
sleep 10

# Health check
echo ""
echo "Checking RAG service health..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✅ RAG service is running${NC}"
else
    echo -e "${RED}❌ RAG service is not responding${NC}"
    echo "Check logs: docker-compose logs rag-service"
    exit 1
fi

cd ../..

echo ""
echo "================================================"
echo "Step 3: Start Node.js Backend"
echo "================================================"
echo ""

# Install Node.js dependencies if needed
if [ ! -d node_modules ]; then
    echo "Installing Node.js dependencies..."
    npm ci
fi

echo ""
echo "Starting Node.js server..."
echo "(Run 'npm run dev' in a separate terminal for development mode)"
echo ""

echo ""
echo "================================================"
echo "🎉 Setup Complete!"
echo "================================================"
echo ""
echo "Services are running:"
echo -e "  ${GREEN}✅ RAG Service:${NC}      http://localhost:8000"
echo -e "  ${GREEN}✅ RAG API Docs:${NC}     http://localhost:8000/docs"
echo -e "  ${GREEN}✅ Node.js Backend:${NC}  http://localhost:3000"
echo ""
echo "Next steps:"
echo "  1. Upload a PDF document:"
echo "     curl -X POST http://localhost:8000/api/v1/documents/upload \\"
echo "       -H \"x-admin-token: change-me\" \\"
echo "       -F \"file=@your-document.pdf\" \\"
echo "       -F \"title=Document Title\" \\"
echo "       -F \"language=ar\""
echo ""
echo "  2. Search documents:"
echo "     curl -X POST http://localhost:3000/api/rag/search \\"
echo "       -H \"Content-Type: application/json\" \\"
echo "       -d '{\"query\": \"search term\", \"language\": \"ar\"}'"
echo ""
echo "  3. Chat with RAG:"
echo "     curl -X POST http://localhost:3000/api/rag/chat \\"
echo "       -H \"Content-Type: application/json\" \\"
echo "       -d '{\"message\": \"your question\", \"language\": \"ar\"}'"
echo ""
echo "To stop services:"
echo "  cd services/rag-service && docker-compose down"
echo ""
echo "For more information, see:"
echo "  - docs/RAG-KNOWLEDGE-BASE.md"
echo "  - services/rag-service/README.md"
echo ""
