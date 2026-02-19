import { expect } from 'chai';
import sinon from 'sinon';
import express from 'express';
import request from 'supertest';
import observatoryRouter from '../../src/routes/observatory.js';

describe('Observatory Routes - Validation Tests', () => {
  let app;

  beforeEach(() => {
    // Create Express app with router
    app = express();
    app.use(express.json());
    
    // Note: These tests focus on validation middleware
    // Full integration tests require database connection
    app.use('/api/observatory', observatoryRouter);
    
    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        error: err.message,
        code: err.code
      });
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Input Validation', () => {
    it('should reject invalid timeRange values', async () => {
      const response = await request(app)
        .get('/api/observatory/metrics?timeRange=invalid')
        .expect(400);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('Invalid time range');
    });

    it('should reject invalid agentId format', async () => {
      const response = await request(app)
        .get('/api/observatory/metrics/invalid@agent!')
        .expect(400);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('alphanumeric');
    });

    it('should reject SQL injection in agentId', async () => {
      const response = await request(app)
        .get("/api/observatory/metrics/test'; DROP TABLE agent_metrics; --")
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should reject agentId with spaces', async () => {
      const response = await request(app)
        .get('/api/observatory/metrics/test agent')
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should reject invalid testId', async () => {
      const response = await request(app)
        .get('/api/observatory/ab-tests/invalid')
        .expect(400);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('positive integer');
    });

    it('should reject zero testId', async () => {
      const response = await request(app)
        .get('/api/observatory/ab-tests/0')
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should reject negative alertId', async () => {
      const response = await request(app)
        .patch('/api/observatory/alerts/-1')
        .send({ thresholdValue: 500 })
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should reject missing required fields in POST /alerts', async () => {
      const response = await request(app)
        .post('/api/observatory/alerts')
        .send({ alertName: 'Test Alert' })
        .expect(400);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('Missing required fields');
    });

    it('should reject missing required fields in POST /ab-tests', async () => {
      const response = await request(app)
        .post('/api/observatory/ab-tests')
        .send({ testName: 'Test' })
        .expect(400);

      expect(response.body).to.have.property('error');
      expect(response.body.error).to.include('Missing required fields');
    });

    it('should reject malformed JSON', async () => {
      const response = await request(app)
        .post('/api/observatory/alerts')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });

  describe('Route Structure', () => {
    it('should have GET /metrics endpoint', async () => {
      // Just verify the route exists (will fail at DB level, not 404)
      await request(app)
        .get('/api/observatory/metrics')
        .expect((res) => {
          expect(res.statusCode).to.not.equal(404);
        });
    });

    it('should have GET /metrics/:agentId endpoint', async () => {
      await request(app)
        .get('/api/observatory/metrics/valid-agent')
        .expect((res) => {
          expect(res.statusCode).to.not.equal(404);
        });
    });

    it('should have GET /tokens/agents endpoint', async () => {
      await request(app)
        .get('/api/observatory/tokens/agents')
        .expect((res) => {
          expect(res.statusCode).to.not.equal(404);
        });
    });

    it('should have GET /tokens/users endpoint', async () => {
      await request(app)
        .get('/api/observatory/tokens/users')
        .expect((res) => {
          expect(res.statusCode).to.not.equal(404);
        });
    });

    it('should have POST /alerts endpoint', async () => {
      // Will fail validation, but route exists
      await request(app)
        .post('/api/observatory/alerts')
        .send({})
        .expect((res) => {
          expect(res.statusCode).to.not.equal(404);
        });
    });

    it('should have GET /alerts endpoint', async () => {
      await request(app)
        .get('/api/observatory/alerts')
        .expect((res) => {
          expect(res.statusCode).to.not.equal(404);
        });
    });

    it('should have POST /ab-tests endpoint', async () => {
      await request(app)
        .post('/api/observatory/ab-tests')
        .send({})
        .expect((res) => {
          expect(res.statusCode).to.not.equal(404);
        });
    });
  });

  describe('Security', () => {
    it('should prevent XSS in agentId', async () => {
      const response = await request(app)
        .get('/api/observatory/metrics/<script>alert("xss")</script>')
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should prevent path traversal in agentId', async () => {
      const response = await request(app)
        .get('/api/observatory/metrics/../../../etc/passwd')
        .expect(400);

      expect(response.body).to.have.property('error');
    });

    it('should validate agentId length', async () => {
      const longId = 'a'.repeat(101);
      const response = await request(app)
        .get(`/api/observatory/metrics/${longId}`)
        .expect(400);

      expect(response.body.error).to.include('100 characters');
    });
  });
});
