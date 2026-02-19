# Observatory Validation Middleware - Testing Guide

## Quick Test Examples

### 1. Testing validateAgentId

```javascript
// Valid agentId examples
GET /api/observatory/metrics/agent-1          // ✓ Valid
GET /api/observatory/metrics/test_agent       // ✓ Valid
GET /api/observatory/metrics/AgentName123     // ✓ Valid
GET /api/observatory/metrics/a                // ✓ Valid
GET /api/observatory/metrics/my-agent_v2      // ✓ Valid

// Invalid agentId examples (returns 400 error)
GET /api/observatory/metrics/agent id         // ✗ Contains space
GET /api/observatory/metrics/agent@id         // ✗ Contains @
GET /api/observatory/metrics/agent.id         // ✗ Contains dot
GET /api/observatory/metrics/agent/path       // ✗ Contains slash
GET /api/observatory/metrics/<script>         // ✗ Contains < >
GET /api/observatory/metrics/[aaa...]         // ✗ 101+ characters
```

**Expected Error Response:**
```json
{
  "error": "Agent ID must contain only alphanumeric characters, underscores, and dashes",
  "status": 400,
  "code": "INVALID_INPUT"
}
```

### 2. Testing validateTimeRange

```javascript
// Valid timeRange examples
GET /api/observatory/metrics?timeRange=1h     // ✓ Valid
GET /api/observatory/metrics?timeRange=6h     // ✓ Valid
GET /api/observatory/metrics?timeRange=24h    // ✓ Valid
GET /api/observatory/metrics?timeRange=7d     // ✓ Valid
GET /api/observatory/metrics?timeRange=30d    // ✓ Valid
GET /api/observatory/metrics                  // ✓ Valid (optional)

// Invalid timeRange examples (returns 400 error)
GET /api/observatory/metrics?timeRange=1d     // ✗ Not in allowlist
GET /api/observatory/metrics?timeRange=12h    // ✗ Not in allowlist
GET /api/observatory/metrics?timeRange=48h    // ✗ Not in allowlist
GET /api/observatory/metrics?timeRange=all    // ✗ Not in allowlist
GET /api/observatory/metrics?timeRange=1w     // ✗ Not in allowlist
```

**Expected Error Response:**
```json
{
  "error": "Invalid time range. Must be one of: 1h, 6h, 24h, 7d, 30d",
  "status": 400,
  "code": "INVALID_INPUT"
}
```

### 3. Testing validateTestId

```javascript
// Valid testId examples
GET /api/observatory/ab-tests/1               // ✓ Valid
GET /api/observatory/ab-tests/100             // ✓ Valid
GET /api/observatory/ab-tests/999999          // ✓ Valid

// Invalid testId examples (returns 400 error)
GET /api/observatory/ab-tests/0               // ✗ Must be >= 1
GET /api/observatory/ab-tests/-1              // ✗ Must be positive
GET /api/observatory/ab-tests/1.5             // ✗ Must be integer
GET /api/observatory/ab-tests/abc             // ✗ Must be number
GET /api/observatory/ab-tests/1'; DROP--      // ✗ SQL injection attempt
```

**Expected Error Response:**
```json
{
  "error": "Test ID must be a positive integer",
  "status": 400,
  "code": "INVALID_INPUT"
}
```

### 4. Testing validateAlertId

```javascript
// Valid alertId examples
PATCH /api/observatory/alerts/1               // ✓ Valid
PATCH /api/observatory/alerts/100             // ✓ Valid

// Invalid alertId examples (returns 400 error)
PATCH /api/observatory/alerts/0               // ✗ Must be >= 1
PATCH /api/observatory/alerts/-5              // ✗ Must be positive
PATCH /api/observatory/alerts/abc             // ✗ Must be number
```

**Expected Error Response:**
```json
{
  "error": "Alert ID must be a positive integer",
  "status": 400,
  "code": "INVALID_INPUT"
}
```

### 5. Testing validateReportTimeRange

```javascript
// Valid date formats
GET /api/observatory/reports/pdf?from=2024-01-01                    // ✓ Valid
GET /api/observatory/reports/pdf?to=2024-12-31                      // ✓ Valid
GET /api/observatory/reports/pdf?from=2024-01-01T10:30:00Z          // ✓ Valid
GET /api/observatory/reports/pdf?from=2024-01-01T10:30:00.123Z      // ✓ Valid
GET /api/observatory/reports/pdf?from=2024-01-01&to=2024-12-31      // ✓ Valid
GET /api/observatory/reports/pdf                                     // ✓ Valid (optional)

// Invalid date formats (returns 400 error)
GET /api/observatory/reports/pdf?from=01-01-2024                     // ✗ Wrong format
GET /api/observatory/reports/pdf?from=2024/01/01                     // ✗ Wrong format
GET /api/observatory/reports/pdf?from=invalid-date                   // ✗ Invalid date
GET /api/observatory/reports/pdf?from=2024-13-01                     // ✗ Invalid month
GET /api/observatory/reports/pdf?from=2024-12-31&to=2024-01-01      // ✗ from > to
```

**Expected Error Response:**
```json
{
  "error": "Invalid \"from\" date format. Must be ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)",
  "status": 400,
  "code": "INVALID_INPUT"
}
```

## WebSocket Authentication Testing

### Valid Connection
```javascript
// Using auth object
const socket = io('http://localhost:3000', {
  auth: {
    token: process.env.ADMIN_TOKEN
  }
});

// Using query parameter
const socket = io('http://localhost:3000', {
  query: {
    token: process.env.ADMIN_TOKEN
  }
});
```

### Invalid Connection (will be rejected)
```javascript
// No token
const socket = io('http://localhost:3000');
// Error: Authentication failed

// Wrong token
const socket = io('http://localhost:3000', {
  auth: { token: 'wrong-token' }
});
// Error: Authentication failed
```

## Database Password Validation Testing

### Valid Production Passwords
```bash
# Minimum 12 characters, not weak
DB_PASSWORD=SecurePass123!
DB_PASSWORD=myStrongDbPassword2024
DB_PASSWORD=P@ssw0rd1234567890
```

### Invalid Production Passwords (will prevent startup)
```bash
# Too short
DB_PASSWORD=short123
# Error: Database password must be at least 12 characters in production

# Weak password
DB_PASSWORD=bsm_password
# Error: Database password cannot be a weak password (bsm_password) in production

DB_PASSWORD=password
# Error: Database password cannot be a weak password (password) in production

DB_PASSWORD=admin
# Error: Database password cannot be a weak password (admin) in production
```

**Note:** Password validation is only enforced when `NODE_ENV=production`

## Automated Testing with cURL

### Test Valid Request
```bash
# Test valid agent metrics request
curl -H "x-admin-token: $ADMIN_TOKEN" \
  "http://localhost:3000/api/observatory/metrics/test-agent?timeRange=24h"

# Expected: 200 OK with metrics data
```

### Test Invalid AgentId
```bash
# Test invalid agent ID with space
curl -H "x-admin-token: $ADMIN_TOKEN" \
  "http://localhost:3000/api/observatory/metrics/test%20agent?timeRange=24h"

# Expected: 400 Bad Request
# {"error":"Agent ID must contain only alphanumeric characters, underscores, and dashes","status":400,"code":"INVALID_INPUT"}
```

### Test Invalid TimeRange
```bash
# Test invalid time range
curl -H "x-admin-token: $ADMIN_TOKEN" \
  "http://localhost:3000/api/observatory/metrics?timeRange=invalid"

# Expected: 400 Bad Request
# {"error":"Invalid time range. Must be one of: 1h, 6h, 24h, 7d, 30d","status":400,"code":"INVALID_INPUT"}
```

### Test Invalid TestId
```bash
# Test invalid test ID
curl -H "x-admin-token: $ADMIN_TOKEN" \
  "http://localhost:3000/api/observatory/ab-tests/0"

# Expected: 400 Bad Request
# {"error":"Test ID must be a positive integer","status":400,"code":"INVALID_INPUT"}
```

### Test WebSocket Authentication
```bash
# Install wscat if not available
npm install -g wscat

# Test valid connection
wscat -c "ws://localhost:3000?token=$ADMIN_TOKEN"
# Expected: Connected

# Test invalid connection
wscat -c "ws://localhost:3000"
# Expected: Error: Authentication failed
```

## Integration Test Script

Create a test script to validate all endpoints:

```bash
#!/bin/bash
# test-observatory-validation.sh

BASE_URL="http://localhost:3000/api/observatory"
ADMIN_TOKEN="${ADMIN_TOKEN:-your-admin-token}"

echo "Testing Observatory Validation..."

# Test 1: Valid agent metrics
echo -n "Test 1: Valid agent metrics... "
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "$BASE_URL/metrics/test-agent?timeRange=24h")
if [ "$response" = "200" ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL (got $response)"
fi

# Test 2: Invalid agent ID
echo -n "Test 2: Invalid agent ID... "
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "$BASE_URL/metrics/test%20agent")
if [ "$response" = "400" ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL (expected 400, got $response)"
fi

# Test 3: Invalid time range
echo -n "Test 3: Invalid time range... "
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "$BASE_URL/metrics?timeRange=invalid")
if [ "$response" = "400" ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL (expected 400, got $response)"
fi

# Test 4: Invalid test ID
echo -n "Test 4: Invalid test ID... "
response=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "$BASE_URL/ab-tests/0")
if [ "$response" = "400" ]; then
  echo "✓ PASS"
else
  echo "✗ FAIL (expected 400, got $response)"
fi

echo "All tests completed!"
```

Run the test script:
```bash
chmod +x test-observatory-validation.sh
./test-observatory-validation.sh
```

## Expected Behavior

1. **Valid requests** → Process normally, return 200/201 response
2. **Invalid input** → Return 400 error with descriptive message
3. **Unauthorized WebSocket** → Connection rejected with error
4. **Weak DB password in production** → Application fails to start

All validation errors are logged and returned in a consistent format using the AppError class.
