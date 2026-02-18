#!/bin/bash
# Test Banking Knowledge Base RAG System

set -e

BASE_URL="http://localhost:8000"
NODE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================================"
echo "Testing Banking Knowledge Base RAG System"
echo "================================================"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "-------------------"
response=$(curl -s "${BASE_URL}/health")
if echo "$response" | grep -q "healthy"; then
    echo -e "${GREEN}✅ RAG service is healthy${NC}"
else
    echo -e "${RED}❌ RAG service health check failed${NC}"
    echo "$response"
fi
echo ""

# Test 2: Node.js Integration Health
echo "Test 2: Node.js Integration Health"
echo "-----------------------------------"
response=$(curl -s "${NODE_URL}/api/rag/health")
if echo "$response" | grep -q "healthy\|connected"; then
    echo -e "${GREEN}✅ Node.js integration is working${NC}"
else
    echo -e "${RED}❌ Node.js integration failed${NC}"
    echo "$response"
fi
echo ""

# Test 3: Search Endpoint (without documents)
echo "Test 3: Search Endpoint"
echo "----------------------"
response=$(curl -s -X POST "${NODE_URL}/api/rag/search" \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "language": "ar", "top_k": 5}')

if echo "$response" | grep -q "query\|results"; then
    echo -e "${GREEN}✅ Search endpoint is working${NC}"
    echo "Response: $response" | head -c 100
    echo "..."
else
    echo -e "${YELLOW}⚠️  Search returned no results (expected if no documents uploaded)${NC}"
fi
echo ""

# Test 4: Chat Endpoint (RAG disabled - should work without documents)
echo "Test 4: RAG Chat Endpoint (RAG disabled)"
echo "---------------------------------------"
response=$(curl -s -X POST "${NODE_URL}/api/rag/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "مرحبا", "language": "ar", "use_rag": false}')

if echo "$response" | grep -q "message"; then
    echo -e "${GREEN}✅ Chat endpoint is working${NC}"
    echo "Response preview: $(echo "$response" | head -c 100)..."
else
    echo -e "${RED}❌ Chat endpoint failed${NC}"
    echo "$response"
fi
echo ""

# Test 5: List Documents
echo "Test 5: List Documents"
echo "---------------------"
response=$(curl -s "${NODE_URL}/api/rag/documents?page=1&page_size=10")

if echo "$response" | grep -q "documents\|total"; then
    echo -e "${GREEN}✅ List documents endpoint is working${NC}"
    total=$(echo "$response" | grep -o '"total":[0-9]*' | grep -o '[0-9]*')
    echo "Total documents: ${total:-0}"
else
    echo -e "${RED}❌ List documents failed${NC}"
    echo "$response"
fi
echo ""

# Test 6: API Documentation
echo "Test 6: API Documentation"
echo "------------------------"
response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/docs")

if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ API documentation is accessible${NC}"
    echo "Visit: ${BASE_URL}/docs"
else
    echo -e "${RED}❌ API documentation is not accessible${NC}"
fi
echo ""

echo "================================================"
echo "Test Summary"
echo "================================================"
echo ""
echo "Basic tests completed. For full functionality testing:"
echo ""
echo "1. Upload a test document:"
echo "   ./scripts/test-document-upload.sh <path-to-pdf>"
echo ""
echo "2. Test full RAG workflow:"
echo "   - Upload document"
echo "   - Wait for processing"
echo "   - Search for content"
echo "   - Chat with RAG enabled"
echo ""
echo "See docs/RAG-KNOWLEDGE-BASE.md for detailed usage."
echo ""
