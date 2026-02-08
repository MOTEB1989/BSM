# ============================================
# BSU Platform - Multi-Stage Dockerfile
# Optimized for production deployment
# ============================================

# ====== Stage 1: Base ======
FROM node:22-alpine AS base

# Add metadata
LABEL maintainer="LexBANK <support@lexdo.uk>"
LABEL description="BSU Platform - Business Services Management API"
LABEL version="1.0.0"

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# ====== Stage 2: Dependencies ======
FROM base AS dependencies

# Install all dependencies (including dev)
RUN npm ci

# ====== Stage 3: Development ======
FROM base AS development

# Install all dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=development

# Run with nodemon for hot-reload
CMD ["npm", "run", "dev"]

# ====== Stage 4: Production Builder ======
FROM base AS builder

# Copy production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Remove unnecessary files
RUN rm -rf tests/ docs/ .github/ scripts/*.sh reports/

# ====== Stage 5: Production ======
FROM node:22-alpine AS production

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy production dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --from=builder /app/src ./src
COPY --from=builder /app/data ./data
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=512" \
    PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start the application
CMD ["node", "src/server.js"]
