# Database Module

Optional database connection helpers for BSM Platform.

## Overview

The BSM platform currently operates without database dependencies, but this module provides connection helpers for future database integration. The module supports MySQL connections as configured in `docker-compose.mysql.yml`.

## Prerequisites

### Install Database Driver

```bash
# For MySQL support
npm install mysql2
```

### Configure Environment

Add to your `.env` file:

```bash
# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=bsm_user
MYSQL_PASSWORD=your_secure_password
MYSQL_DATABASE=bsm_db
```

### Start Database

```bash
# Start MySQL using Docker Compose
docker-compose -f docker-compose.mysql.yml up -d
```

## Usage

### Basic Query

```javascript
import { query } from './database/mysql.js';

// Execute a query
const users = await query('SELECT * FROM users WHERE role = ?', ['admin']);
console.log('Admin users:', users);
```

### Single Row Query

```javascript
import { queryOne } from './database/mysql.js';

// Get single user
const user = await queryOne('SELECT * FROM users WHERE id = ?', [123]);
if (user) {
  console.log('User found:', user.username);
}
```

### Transactions

```javascript
import { beginTransaction } from './database/mysql.js';

const connection = await beginTransaction();

try {
  // Execute multiple queries in transaction
  await connection.execute(
    'INSERT INTO users (username, email) VALUES (?, ?)',
    ['john_doe', 'john@example.com']
  );
  
  await connection.execute(
    'INSERT INTO audit_logs (action, details) VALUES (?, ?)',
    ['user_created', JSON.stringify({ username: 'john_doe' })]
  );
  
  // Commit transaction
  await connection.commit();
  console.log('Transaction committed');
} catch (error) {
  // Rollback on error
  await connection.rollback();
  console.error('Transaction rolled back:', error);
} finally {
  // Always release connection
  connection.release();
}
```

### Connection Pool

```javascript
import { initPool, getConnection, closePool } from './database/mysql.js';

// Initialize connection pool
initPool();

// Get a connection
const connection = await getConnection();

try {
  const [rows] = await connection.execute('SELECT * FROM agents');
  console.log('Agents:', rows);
} finally {
  connection.release();
}

// Close pool on shutdown
await closePool();
```

### Health Check

```javascript
import { healthCheck } from './database/mysql.js';

// Check database connectivity
const isHealthy = await healthCheck();
if (isHealthy) {
  console.log('✓ Database is connected');
} else {
  console.error('✗ Database connection failed');
}
```

## Example Queries

The module includes pre-built query examples:

```javascript
import { examples } from './database/mysql.js';

// Get user by ID
const user = await examples.getUserById(123);

// Create new user
await examples.createUser('jane_doe', 'jane@example.com', 'user');

// Get active agents
const agents = await examples.getActiveAgents();

// Create agent execution log
const executionId = await examples.createExecution(
  'legal-advisor',
  123,
  'What are the requirements for...?'
);

// Complete execution
await examples.completeExecution(
  executionId,
  'Here are the requirements...',
  'success',
  1250 // duration in ms
);

// Create audit log
await examples.createAuditLog(
  'agent_execution',
  'completed',
  123,
  { agent: 'legal-advisor', duration: 1250 }
);
```

## Integration with Express

### Add to Health Endpoint

```javascript
import { healthCheck as mysqlHealth } from './database/mysql.js';

app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: await mysqlHealth()
  };
  
  res.json(health);
});
```

### Middleware for Database Connection

```javascript
import { getConnection } from './database/mysql.js';

// Add database connection to request
export const dbMiddleware = async (req, res, next) => {
  try {
    req.db = await getConnection();
    
    // Release connection after response
    res.on('finish', () => {
      if (req.db) {
        req.db.release();
      }
    });
    
    next();
  } catch (error) {
    console.error('Database middleware error:', error);
    res.status(503).json({ error: 'Database unavailable' });
  }
};

// Use in routes
app.get('/api/users', dbMiddleware, async (req, res) => {
  const [users] = await req.db.execute('SELECT * FROM users');
  res.json(users);
});
```

## Error Handling

```javascript
import { query } from './database/mysql.js';

try {
  const users = await query('SELECT * FROM users');
  res.json(users);
} catch (error) {
  if (error.code === 'ER_NO_SUCH_TABLE') {
    console.error('Table does not exist:', error.message);
    res.status(500).json({ error: 'Database not initialized' });
  } else if (error.code === 'ECONNREFUSED') {
    console.error('Cannot connect to database:', error.message);
    res.status(503).json({ error: 'Database unavailable' });
  } else {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

## Configuration

### Connection Pool Settings

Modify in `mysql.js`:

```javascript
const config = {
  host: env.MYSQL_HOST || 'localhost',
  port: parseInt(env.MYSQL_PORT || '3306', 10),
  user: env.MYSQL_USER || 'bsm_user',
  password: env.MYSQL_PASSWORD,
  database: env.MYSQL_DATABASE || 'bsm_db',
  waitForConnections: true,
  connectionLimit: 10,        // Max connections in pool
  queueLimit: 0,              // No limit on queue
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: 'Z',              // UTC timezone
  dateStrings: true,          // Return dates as strings
};
```

### Connection Timeout

```javascript
const connection = await pool.getConnection();
await connection.query('SET SESSION wait_timeout = 28800'); // 8 hours
```

## Security

### Prepared Statements

Always use prepared statements to prevent SQL injection:

```javascript
// ✓ Good - Uses prepared statement
const users = await query('SELECT * FROM users WHERE id = ?', [userId]);

// ✗ Bad - Vulnerable to SQL injection
const users = await query(`SELECT * FROM users WHERE id = ${userId}`);
```

### Connection String Security

Never hardcode credentials:

```javascript
// ✓ Good - Uses environment variables
password: env.MYSQL_PASSWORD

// ✗ Bad - Hardcoded password
password: 'my_secret_password'
```

### Least Privilege

Use database users with minimal required permissions:

```sql
-- Create limited user
CREATE USER 'bsm_readonly'@'%' IDENTIFIED BY 'password';
GRANT SELECT ON bsm_db.* TO 'bsm_readonly'@'%';
FLUSH PRIVILEGES;
```

## Performance

### Connection Pooling

Connection pools are automatically managed. No need to create/close connections manually for each query.

### Query Optimization

```javascript
// Add indexes for frequently queried columns
await query('CREATE INDEX idx_username ON users(username)');

// Use EXPLAIN to analyze queries
const [plan] = await query('EXPLAIN SELECT * FROM users WHERE username = ?', ['john']);
console.log('Query plan:', plan);
```

### Caching

```javascript
// Simple in-memory cache
const cache = new Map();

async function getCachedAgents() {
  if (cache.has('agents')) {
    return cache.get('agents');
  }
  
  const agents = await query('SELECT * FROM agents WHERE enabled = TRUE');
  cache.set('agents', agents);
  
  // Invalidate after 5 minutes
  setTimeout(() => cache.delete('agents'), 5 * 60 * 1000);
  
  return agents;
}
```

## Testing

### Mock Database for Tests

```javascript
// test/mocks/database.js
export const mockQuery = jest.fn();
export const mockQueryOne = jest.fn();

jest.mock('../src/database/mysql.js', () => ({
  query: (...args) => mockQuery(...args),
  queryOne: (...args) => mockQueryOne(...args),
}));
```

### Integration Tests

```javascript
import { query, healthCheck } from '../src/database/mysql.js';

describe('MySQL Integration', () => {
  it('should connect to database', async () => {
    const isHealthy = await healthCheck();
    expect(isHealthy).toBe(true);
  });
  
  it('should execute queries', async () => {
    const users = await query('SELECT * FROM users LIMIT 1');
    expect(Array.isArray(users)).toBe(true);
  });
});
```

## Troubleshooting

### "Cannot find module 'mysql2'"

```bash
npm install mysql2
```

### "ER_NOT_SUPPORTED_AUTH_MODE"

Use mysql_native_password (configured in docker-compose.mysql.yml):

```yaml
mysql:
  command: --default-authentication-plugin=mysql_native_password
```

### "ECONNREFUSED"

Ensure MySQL is running:

```bash
docker-compose -f docker-compose.mysql.yml ps mysql
docker-compose -f docker-compose.mysql.yml logs mysql
```

### Connection Pool Exhausted

Increase pool size or reduce connection hold time:

```javascript
connectionLimit: 20  // Increase from default 10
```

## Additional Resources

- [mysql2 Documentation](https://github.com/sidorares/node-mysql2)
- [MySQL Best Practices](https://dev.mysql.com/doc/refman/8.0/en/best-practices.html)
- [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Main MySQL Documentation](../../docs/MYSQL-MULTI-CONTAINER.md)

## License

Part of BSM Platform. See [LICENSE](../../LICENSE) for details.
