#!/bin/bash
# Upload a test document to RAG service

if [ $# -eq 0 ]; then
    echo "Usage: ./test-document-upload.sh <path-to-pdf-file>"
    echo ""
    echo "Example:"
    echo "  ./test-document-upload.sh ~/Documents/sama-regulation.pdf"
    exit 1
fi

PDF_FILE="$1"
ADMIN_TOKEN="${ADMIN_TOKEN:-change-me}"
BASE_URL="${RAG_URL:-http://localhost:8000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "================================================"
echo "Uploading Document to RAG Service"
echo "================================================"
echo ""

# Check if file exists
if [ ! -f "$PDF_FILE" ]; then
    echo -e "${RED}❌ File not found: $PDF_FILE${NC}"
    exit 1
fi

# Check if it's a PDF
if [[ ! "$PDF_FILE" =~ \.pdf$ ]]; then
    echo -e "${RED}❌ File must be a PDF${NC}"
    exit 1
fi

echo "File: $PDF_FILE"
echo "Size: $(du -h "$PDF_FILE" | cut -f1)"
echo ""

# Extract filename for title
FILENAME=$(basename "$PDF_FILE" .pdf)

echo "Uploading to $BASE_URL..."
echo ""

# Upload document
response=$(curl -s -X POST "${BASE_URL}/api/v1/documents/upload" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  -F "file=@$PDF_FILE" \
  -F "title=$FILENAME" \
  -F "document_type=regulation" \
  -F "jurisdiction=SAMA" \
  -F "language=ar" \
  -F "version=1.0")

# Check response
if echo "$response" | grep -q "document_id"; then
    echo -e "${GREEN}✅ Document uploaded successfully!${NC}"
    echo ""
    echo "Response:"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    echo ""
    
    # Extract document ID
    doc_id=$(echo "$response" | grep -o '"document_id":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$doc_id" ]; then
        echo "Document ID: $doc_id"
        echo ""
        echo "You can now:"
        echo "  1. Search: curl -X POST http://localhost:3000/api/rag/search -H 'Content-Type: application/json' -d '{\"query\": \"search term\", \"language\": \"ar\"}'"
        echo "  2. Chat: curl -X POST http://localhost:3000/api/rag/chat -H 'Content-Type: application/json' -d '{\"message\": \"question\", \"language\": \"ar\"}'"
    fi
else
    echo -e "${RED}❌ Upload failed${NC}"
    echo ""
    echo "Response:"
    echo "$response"
    echo ""
    echo "Check:"
    echo "  - RAG service is running: curl http://localhost:8000/health"
    echo "  - Admin token is correct (set ADMIN_TOKEN environment variable)"
    echo "  - File is a valid PDF"
fi
echo ""
