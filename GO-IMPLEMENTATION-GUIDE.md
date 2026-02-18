# BSM Platform - Go Integration Implementation Guide

> **Version**: 1.0.0  
> **Date**: 2026-02-06  
> **Status**: Implementation Ready

## Overview

This guide provides step-by-step instructions for implementing Go microservices integration into the BSM platform. Follow these steps to add high-performance Go services alongside the existing Node.js application.

---

## Prerequisites

### Required Software

- **Go**: 1.22 or later
- **Node.js**: 22 or later
- **Docker**: 20.10 or later
- **Docker Compose**: 2.0 or later
- **Git**: Latest version

### Required Knowledge

- Basic Go programming
- Docker and containerization
- Microservices architecture
- HTTP/REST APIs

---

## Quick Start (5 Minutes)

### 1. Clone and Setup

```bash
# Navigate to BSM directory
cd /path/to/BSM

# Install Node.js dependencies (if not already done)
npm install

# Navigate to Go service
cd services/document-processor

# Initialize Go modules
go mod download

# Run tests
go test ./...
```

### 2. Start Hybrid Stack

```bash
# From BSM root directory
docker-compose -f docker-compose.hybrid.yml up -d

# Check service health
curl http://localhost:3000/api/health  # Node.js
curl http://localhost:8080/health      # Go Document Processor
```

### 3. Test Integration

```bash
# Test document parsing
curl -X POST http://localhost:8080/api/v1/documents/parse \
  -H "Content-Type: application/json" \
  -d '{"file_url": "https://example.com/sample.pdf", "format": "pdf"}'

# Test from Node.js
curl -X POST http://localhost:3000/api/documents/process \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/sample.pdf"}'
```

---

## Detailed Implementation Steps

### Phase 1: Development Environment Setup

#### Step 1.1: Install Go

```bash
# macOS
brew install go

# Linux
wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz

# Verify installation
go version
```

#### Step 1.2: Configure Go Workspace

```bash
# Set GOPATH (if not already set)
export GOPATH=$HOME/go
export PATH=$PATH:$GOPATH/bin

# Add to ~/.bashrc or ~/.zshrc for persistence
echo 'export GOPATH=$HOME/go' >> ~/.bashrc
echo 'export PATH=$PATH:$GOPATH/bin' >> ~/.bashrc
```

#### Step 1.3: Install Development Tools

```bash
# Go language server
go install golang.org/x/tools/gopls@latest

# Linter
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Test coverage tool
go install github.com/axw/gocov/gocov@latest

# Air (live reload for Go)
go install github.com/cosmtrek/air@latest
```

### Phase 2: Build Document Processor Service

#### Step 2.1: Build Binary

```bash
cd services/document-processor

# Development build
go build -o bin/server cmd/server/main.go

# Production build (optimized)
CGO_ENABLED=0 GOOS=linux go build \
  -a -installsuffix cgo \
  -ldflags '-s -w' \
  -o bin/server \
  cmd/server/main.go
```

#### Step 2.2: Run Tests

```bash
# Run all tests
go test ./...

# Run tests with coverage
go test -cover ./...

# Generate coverage report
go test -coverprofile=coverage.out ./...
go tool cover -html=coverage.out -o coverage.html

# Run benchmarks
go test -bench=. ./...
```

#### Step 2.3: Run Service Locally

```bash
# Set environment variables
export PORT=8080
export LOG_LEVEL=debug

# Run server
go run cmd/server/main.go

# Or use air for live reload
air
```

### Phase 3: Docker Integration

#### Step 3.1: Build Docker Image

```bash
# Build image
docker build -t bsm-doc-processor:latest .

# Test image
docker run -p 8080:8080 bsm-doc-processor:latest

# Check health
curl http://localhost:8080/health
```

#### Step 3.2: Docker Compose Setup

```bash
# Start all services
docker-compose -f docker-compose.hybrid.yml up -d

# View logs
docker-compose -f docker-compose.hybrid.yml logs -f

# Stop services
docker-compose -f docker-compose.hybrid.yml down

# Remove volumes
docker-compose -f docker-compose.hybrid.yml down -v
```

### Phase 4: Node.js Integration

#### Step 4.1: Add Environment Variables

```bash
# Add to .env file
GO_DOCUMENT_SERVICE=http://localhost:8080
GO_SEARCH_SERVICE=http://localhost:8081
```

#### Step 4.2: Create Integration Controller

Create `src/controllers/documentProcessorController.js`:

```javascript
import { documentProcessorClient } from "../services/goServiceClient.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("DocumentProcessorController");

export async function processDocument(req, res, next) {
  try {
    const { url, format } = req.body;

    logger.info({ url, format }, "Processing document");

    // Call Go service
    const result = await documentProcessorClient.parseDocument(url, {
      format,
      correlationId: req.correlationId,
    });

    res.json(result);
  } catch (error) {
    logger.error({ err: error }, "Document processing failed");
    next(error);
  }
}
```

#### Step 4.3: Add Routes

Update `src/routes/documents.js`:

```javascript
import express from "express";
import { processDocument } from "../controllers/documentProcessorController.js";

const router = express.Router();

router.post("/process", processDocument);

export default router;
```

#### Step 4.4: Register Routes

Update `src/app.js`:

```javascript
import documentRoutes from "./routes/documents.js";

// Add route
app.use("/api/documents", documentRoutes);
```

### Phase 5: Testing

#### Step 5.1: Unit Tests (Go)

Create `internal/processor/parser_test.go`:

```go
package processor

import (
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestParsePDF(t *testing.T) {
    // Test implementation
    result, err := ParsePDF("test.pdf")
    assert.NoError(t, err)
    assert.NotEmpty(t, result)
}
```

#### Step 5.2: Integration Tests (Node.js)

Create `tests/integration/document-processor.test.js`:

```javascript
import { documentProcessorClient } from "../../src/services/goServiceClient.js";
import { expect } from "chai";

describe("Document Processor Integration", () => {
  it("should parse document", async () => {
    const result = await documentProcessorClient.parseDocument(
      "https://example.com/test.pdf"
    );
    
    expect(result).to.have.property("text");
    expect(result).to.have.property("pages");
  });
});
```

#### Step 5.3: Load Testing

```bash
# Install Artillery
npm install -g artillery

# Create test configuration
cat > tests/load/document-processor.yml << EOF
config:
  target: "http://localhost:8080"
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "Parse PDF"
    flow:
      - post:
          url: "/api/v1/documents/parse"
          json:
            file_url: "https://example.com/sample.pdf"
            format: "pdf"
EOF

# Run load test
artillery run tests/load/document-processor.yml
```

### Phase 6: Monitoring

#### Step 6.1: Start Monitoring Stack

```bash
# Start Prometheus and Grafana
docker-compose -f docker-compose.hybrid.yml up -d prometheus grafana

# Access dashboards
open http://localhost:9090  # Prometheus
open http://localhost:3001  # Grafana (admin/admin)
```

#### Step 6.2: Configure Grafana

1. Open Grafana: http://localhost:3001
2. Login: admin/admin
3. Add Prometheus datasource:
   - URL: http://prometheus:9090
   - Click "Save & Test"
4. Import dashboard:
   - Dashboard ID: 1860 (Node Exporter)
   - Select Prometheus datasource

#### Step 6.3: View Metrics

```bash
# Go service metrics
curl http://localhost:8080/metrics

# Query Prometheus
curl 'http://localhost:9090/api/v1/query?query=document_processor_requests_total'
```

### Phase 7: Deployment

#### Step 7.1: Production Build

```bash
# Build production images
docker build -t ghcr.io/lexbank/bsm-doc-processor:1.0.0 \
  ./services/document-processor

# Push to registry
docker push ghcr.io/lexbank/bsm-doc-processor:1.0.0
```

#### Step 7.2: Deploy to Render.com

Update `render.yaml`:

```yaml
services:
  - type: web
    name: bsm-doc-processor
    env: go
    buildCommand: |
      cd services/document-processor
      go build -o bin/server cmd/server/main.go
    startCommand: ./services/document-processor/bin/server
    envVars:
      - key: PORT
        value: 8080
      - key: LOG_LEVEL
        value: info
```

#### Step 7.3: Deploy to Kubernetes

```bash
# Apply manifests
kubectl apply -f kubernetes/go-document-processor.yaml

# Check deployment
kubectl get pods -l app=go-doc-processor

# Check logs
kubectl logs -f deployment/go-doc-processor
```

---

## Configuration

### Environment Variables

#### Node.js Service

```env
# Go service endpoints
GO_DOCUMENT_SERVICE=http://go-doc-processor:8080
GO_SEARCH_SERVICE=http://go-search:8081

# Existing variables
NODE_ENV=production
PORT=3000
OPENAI_BSM_KEY=your-key
ADMIN_TOKEN=your-token
```

#### Go Document Processor

```env
# Server configuration
PORT=8080
LOG_LEVEL=info

# Processing limits
MAX_FILE_SIZE=52428800  # 50MB
WORKERS=10
```

---

## Troubleshooting

### Common Issues

#### 1. Go Module Download Fails

```bash
# Clear module cache
go clean -modcache

# Download again
go mod download
```

#### 2. Docker Build Fails

```bash
# Remove old images
docker image prune -a

# Rebuild without cache
docker build --no-cache -t bsm-doc-processor .
```

#### 3. Service Connection Issues

```bash
# Check service is running
docker ps

# Check logs
docker logs bsm-go-doc-processor

# Test connectivity
docker exec bsm-node-api ping go-doc-processor
```

#### 4. Port Conflicts

```bash
# Find process using port
lsof -i :8080

# Kill process
kill -9 <PID>
```

---

## Performance Optimization

### Go Service Optimization

```go
// Use connection pooling
var httpClient = &http.Client{
    Timeout: 30 * time.Second,
    Transport: &http.Transport{
        MaxIdleConns:        100,
        MaxIdleConnsPerHost: 100,
        IdleConnTimeout:     90 * time.Second,
    },
}

// Use worker pools for concurrent processing
func processDocuments(docs []Document) {
    numWorkers := runtime.NumCPU()
    jobs := make(chan Document, len(docs))
    results := make(chan Result, len(docs))

    for w := 0; w < numWorkers; w++ {
        go worker(jobs, results)
    }

    for _, doc := range docs {
        jobs <- doc
    }
    close(jobs)

    for range docs {
        <-results
    }
}
```

### Node.js Client Optimization

```javascript
// Connection pooling
import http from "http";
import https from "https";

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 50,
});

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
});

// Use agents in fetch
fetch(url, {
  agent: url.startsWith("https") ? httpsAgent : httpAgent,
});
```

---

## Next Steps

1. **Implement PDF Processing**: Add real PDF parsing logic
2. **Add Search Service**: Create full-text search microservice
3. **Implement Analytics**: Add analytics engine
4. **Add Caching**: Implement Redis caching layer
5. **Set Up CI/CD**: Automate testing and deployment

---

## Resources

### Documentation

- [Go Documentation](https://go.dev/doc/)
- [Chi Router](https://github.com/go-chi/chi)
- [Zerolog](https://github.com/rs/zerolog)
- [Prometheus](https://prometheus.io/docs/)

### Learning Resources

- [Tour of Go](https://go.dev/tour/)
- [Effective Go](https://go.dev/doc/effective_go)
- [Go by Example](https://gobyexample.com/)

### Tools

- [GoLand IDE](https://www.jetbrains.com/go/)
- [VS Code Go Extension](https://marketplace.visualstudio.com/items?itemName=golang.go)
- [Postman](https://www.postman.com/)

---

## Support

For questions or issues:

1. Check existing GitHub issues
2. Review documentation
3. Contact the development team

---

**Document Owner**: BSM Autonomous Architect  
**Last Updated**: 2026-02-06  
**Status**: Ready for Implementation
