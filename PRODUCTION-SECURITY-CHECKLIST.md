# 🔒 BSM Production Security Checklist

**Version:** 1.0  
**Last Updated:** February 2025

Before deploying BSM to production, ensure all security measures are in place. Use this checklist to verify your deployment is secure and production-ready.

---

## ✅ Pre-Deployment Security Checks

### 1. Environment Configuration

- [ ] All default passwords have been changed
  - [ ] `ADMIN_TOKEN` is NOT "change-me"
  - [ ] `ADMIN_TOKEN` is at least 32 characters long
  - [ ] `POSTGRES_PASSWORD` is NOT "secret"
  - [ ] `MYSQL_PASSWORD` is NOT "bsm_password"
  - [ ] `GRAFANA_PASSWORD` is NOT "admin"

- [ ] Secrets are properly configured
  - [ ] `GITHUB_WEBHOOK_SECRET` is set (64+ characters recommended)
  - [ ] `ENCRYPTION_KEY` is set (64 hex characters)
  - [ ] All secrets use strong random generation
  - [ ] No secrets are committed to git

- [ ] Environment variables are correct
  - [ ] `NODE_ENV=production` is set
  - [ ] `LOG_LEVEL=info` or `warn` (not `debug`)
  - [ ] `CORS_ORIGINS` includes only trusted domains
  - [ ] `REDIS_URL` points to production Redis

- [ ] API keys are secured
  - [ ] Keys are in environment variables or secrets manager
  - [ ] Keys are NOT in .env file committed to git
  - [ ] Key rotation schedule is documented
  - [ ] Backup keys are available

### 2. Rate Limiting

- [ ] Redis is configured and accessible
  - [ ] Connection string is correct
  - [ ] Redis is persistent (AOF enabled)
  - [ ] Redis has authentication enabled
  - [ ] Redis uses TLS if external

- [ ] Rate limits are properly set
  - [ ] Webhook endpoint: 10 requests/minute
  - [ ] API endpoints: 100 requests/15 minutes
  - [ ] Heavy operations: 10 requests/hour
  - [ ] Rate limiting uses Redis store (not in-memory)

- [ ] Rate limit monitoring is active
  - [ ] Alerts configured for high violation rates
  - [ ] Logs capture rate limit hits
  - [ ] Metrics exported to Prometheus

### 3. Security Features

- [ ] Webhook security is enabled
  - [ ] Signature verification is MANDATORY (no bypasses)
  - [ ] Replay protection is enabled
  - [ ] Webhook cache uses Redis
  - [ ] Webhook timeout is set (5 minutes max age)

- [ ] Input validation is comprehensive
  - [ ] All user inputs are sanitized
  - [ ] Message length limits enforced
  - [ ] History array limits enforced (max 50)
  - [ ] XSS protection enabled

- [ ] API key management
  - [ ] Key format validation enabled
  - [ ] Key blacklisting enabled (3 failures)
  - [ ] Circuit breaker configured
  - [ ] Failed requests are tracked

- [ ] Authentication & Authorization
  - [ ] Admin endpoints require `x-admin-token`
  - [ ] Timing-safe token comparison used
  - [ ] No token logging in production
  - [ ] Token expiration considered

### 4. Infrastructure Security

- [ ] Network security
  - [ ] HTTPS/TLS is enabled and enforced
  - [ ] TLS certificate is valid
  - [ ] Certificate auto-renewal configured
  - [ ] HTTP redirects to HTTPS

- [ ] Database security
  - [ ] Database connections use SSL/TLS
  - [ ] Database passwords are strong (32+ characters)
  - [ ] Database user has minimum required privileges
  - [ ] Database backups are encrypted

- [ ] Service isolation
  - [ ] Services run in separate containers
  - [ ] Internal network isolation enabled
  - [ ] Only required ports are exposed
  - [ ] Firewall rules are configured

### 5. Monitoring & Alerting

- [ ] Prometheus is collecting metrics
  - [ ] All services export metrics
  - [ ] Metrics endpoint is secured
  - [ ] Retention is configured

- [ ] Grafana dashboards are configured
  - [ ] Default admin password changed
  - [ ] User sign-up disabled
  - [ ] Dashboards monitor key metrics

- [ ] Alerts are set up for:
  - [ ] High rate limit violations (>10/min)
  - [ ] Webhook signature failures (>5/min)
  - [ ] High memory usage (>85%)
  - [ ] Circuit breaker open states
  - [ ] API key failures (>3/hour)
  - [ ] High error rates (>5%)

- [ ] Logging is configured
  - [ ] Structured logging enabled
  - [ ] Sensitive data is NOT logged
  - [ ] Log retention policy set
  - [ ] Log aggregation configured

### 6. Code Security

- [ ] Dependencies are up to date
  - [ ] `npm audit` shows no high/critical vulnerabilities
  - [ ] All dependencies have recent updates
  - [ ] Dependabot alerts are enabled
  - [ ] Automated security scanning active

- [ ] Secret scanning
  - [ ] `.gitleaks.toml` is configured
  - [ ] GitHub secret scanning enabled
  - [ ] No secrets in git history
  - [ ] `.env` files are gitignored

- [ ] Code quality
  - [ ] No `eval()` usage in code
  - [ ] No SQL injection vulnerabilities
  - [ ] No XSS vulnerabilities
  - [ ] Error messages don't leak info

### 7. Testing & Validation

- [ ] Security tests pass
  - [ ] Rate limiting tests
  - [ ] Authentication tests
  - [ ] Input validation tests
  - [ ] Webhook signature tests

- [ ] Performance tests pass
  - [ ] Load testing completed (100+ concurrent requests)
  - [ ] Stress testing completed
  - [ ] Memory leak tests pass
  - [ ] Response times within SLA

- [ ] Integration tests pass
  - [ ] All API endpoints tested
  - [ ] Database connections verified
  - [ ] Redis connections verified
  - [ ] External API integrations tested

- [ ] Security scanning
  - [ ] CodeQL analysis passed
  - [ ] Container scanning passed
  - [ ] Dependency scanning passed
  - [ ] Penetration testing completed (if required)

### 8. Documentation

- [ ] Security documentation is current
  - [ ] Security architecture documented
  - [ ] Threat model documented
  - [ ] Security controls documented
  - [ ] Compliance requirements documented

- [ ] Operational procedures
  - [ ] Incident response plan exists
  - [ ] Key rotation procedures documented
  - [ ] Backup and recovery procedures documented
  - [ ] Deployment procedures documented
  - [ ] Rollback procedures documented

- [ ] Access control
  - [ ] Admin access is documented
  - [ ] Secret access is documented
  - [ ] Audit log access is documented
  - [ ] Emergency access procedures exist

### 9. Compliance & Legal

- [ ] Data protection
  - [ ] GDPR compliance verified (if applicable)
  - [ ] Data retention policies set
  - [ ] User data encryption enabled
  - [ ] Privacy policy published

- [ ] Security policies
  - [ ] Acceptable use policy exists
  - [ ] Password policy enforced
  - [ ] Access control policy exists
  - [ ] Incident response policy exists

### 10. Deployment Verification

- [ ] Pre-deployment checks
  - [ ] Environment validation script passes
  - [ ] All tests pass in staging
  - [ ] Configuration reviewed by team
  - [ ] Rollback plan documented

- [ ] Post-deployment verification
  - [ ] Health checks pass
  - [ ] Metrics are flowing
  - [ ] Logs are aggregating
  - [ ] Alerts are active
  - [ ] Performance baseline established

---

## 🚀 Deployment Commands

### 1. Validate Environment

```bash
# Run environment validation
npm run validate:env

# Check for vulnerabilities
npm audit

# Run security tests
npm test -- security.test.js
```

### 2. Pre-Deployment

```bash
# Build and test
npm ci
npm run build
npm test

# Verify configuration
bash scripts/validate-env.sh

# Check Docker images
docker-compose config
```

### 3. Deploy

```bash
# Production deployment
docker-compose -f docker-compose.yml up -d

# Verify services
docker-compose ps
docker-compose logs -f
```

### 4. Post-Deployment

```bash
# Health check
curl https://your-domain.com/health

# Check metrics
curl https://your-domain.com/metrics

# Monitor logs
docker-compose logs -f --tail=100
```

---

## 📊 Security Metrics to Monitor

### Real-time Metrics

- **Request Rate:** < 1000 req/min average
- **Error Rate:** < 1% of requests
- **Response Time:** < 500ms p95
- **Memory Usage:** < 85% of available
- **CPU Usage:** < 80% average

### Security Metrics

- **Rate Limit Hits:** < 5/min
- **Webhook Failures:** < 2/hour
- **API Key Failures:** < 1/hour
- **Auth Failures:** < 10/hour
- **Circuit Breaker Opens:** 0

### Alerting Thresholds

- **Critical:** Circuit breaker open, Memory >90%, Auth failures >50/hour
- **Warning:** Rate limits >10/min, Response time >1s p95
- **Info:** Deployment events, Key rotation events

---

## 🆘 Incident Response

### Security Incident

1. **Detect:** Alert fires or anomaly detected
2. **Assess:** Determine severity and scope
3. **Contain:** Isolate affected systems
4. **Remediate:** Fix vulnerability or rotate credentials
5. **Recover:** Restore normal operations
6. **Review:** Post-incident analysis and documentation

### Emergency Contacts

- **Security Lead:** [Your team's security contact]
- **DevOps Lead:** [Your team's ops contact]
- **On-Call Engineer:** [On-call rotation]

### Quick Actions

```bash
# Disable compromised key
# 1. Update environment variable to empty string
# 2. Restart services
docker-compose restart

# Rotate admin token
NEW_TOKEN=$(openssl rand -base64 32)
# Update in secrets manager and restart

# Block IP address (if using firewall)
# Add IP to firewall rules

# Enable rate limiting to minimum
# Update RATE_LIMIT_MAX=10 and restart
```

---

## 📝 Sign-Off

Before deploying to production, ensure this checklist is completed and signed off by:

- [ ] **Developer:** _________________ Date: _______
- [ ] **Security Lead:** _________________ Date: _______
- [ ] **DevOps Engineer:** _________________ Date: _______
- [ ] **Project Manager:** _________________ Date: _______

---

## 📚 Additional Resources

- [Full Security Audit Report](./reports/SECURITY-AUDIT-PERFORMANCE.md)
- [Security Quick Fixes Guide](./reports/SECURITY-QUICK-FIXES.md)
- [Architecture Documentation](./ARCHITECTURE-DIAGRAMS.md)
- [Incident Response Plan](./docs/incident-response.md)

---

**Last Review Date:** __________  
**Next Review Date:** __________  
**Reviewed By:** __________
