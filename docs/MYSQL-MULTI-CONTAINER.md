# MySQL Multi-Container Docker Setup

This guide follows Microsoft's Visual Studio Docker tutorial for building multi-container applications with MySQL.

## Overview

The BSM platform supports multiple database configurations:
- **MySQL** - Using `docker-compose.mysql.yml` (this guide)
- **PostgreSQL** - Using `docker-compose.yml.example` or `docker-compose.hybrid.yml`

This document focuses on the MySQL multi-container setup, implementing best practices from [Microsoft's Docker Multi-Container Tutorial](https://learn.microsoft.com/en-us/visualstudio/docker/tutorials/tutorial-multi-container-app-mysql).

## Architecture

The multi-container setup includes:

```
┌─────────────────┐
│   BSM App       │  Port 3000
│   (Node.js)     │
└────────┬────────┘
         │
         ├──────────┐
         │          │
         ▼          ▼
┌────────────┐  ┌──────────┐
│   MySQL    │  │  Redis   │
│  Database  │  │  Cache   │
└────────────┘  └──────────┘
 Port 3306       Port 6379
```

### Services

1. **app** - Node.js application (BSM Platform)
2. **mysql** - MySQL 8.0 database
3. **redis** - Redis 7 cache

All services run in an isolated Docker network (`bsm-network`) and can communicate using service names as hostnames.

## Prerequisites

Before starting, ensure you have:

### Required Software
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
  - Includes Docker Compose
  - Verify: `docker --version` and `docker-compose --version`
- Node.js 22+ (for local development without Docker)
- Git (for cloning the repository)

### Required Knowledge
- Basic Docker concepts (images, containers, volumes)
- Docker Compose YAML syntax
- Basic MySQL/database concepts
- Understanding of environment variables

### Recommended Tutorials
Complete these Microsoft tutorials first:
1. [Create a Container App](https://learn.microsoft.com/en-us/visualstudio/docker/tutorials/docker-tutorial)
2. [Persist Data in Your App](https://learn.microsoft.com/en-us/visualstudio/docker/tutorials/tutorial-persist-data-layer)
3. [Multi-Container Apps](https://learn.microsoft.com/en-us/visualstudio/docker/tutorials/tutorial-multi-container-app-mysql)

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/LexBANK/BSM.git
cd BSM

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# At minimum, set OPENAI_BSM_KEY and ADMIN_TOKEN
nano .env
```

### 2. Configure Environment Variables

Edit `.env` and configure MySQL settings:

```bash
# MySQL Configuration
MYSQL_ROOT_PASSWORD=your_secure_root_password
MYSQL_PASSWORD=your_secure_user_password
MYSQL_USER=bsm_user
MYSQL_DATABASE=bsm_db

# Application Configuration
OPENAI_BSM_KEY=your_openai_api_key
ADMIN_TOKEN=your_admin_token
```

⚠️ **Security Warning**: Never commit `.env` with real credentials to version control!

### 3. Start Services

```bash
# Start all services in detached mode
docker-compose -f docker-compose.mysql.yml up -d

# View logs
docker-compose -f docker-compose.mysql.yml logs -f

# Check service status
docker-compose -f docker-compose.mysql.yml ps
```

### 4. Verify Services

```bash
# Check application health
curl http://localhost:3000/api/health

# Check MySQL connection
docker-compose -f docker-compose.mysql.yml exec mysql \
  mysql -u bsm_user -p bsm_db -e "SELECT VERSION();"

# Check Redis connection
docker-compose -f docker-compose.mysql.yml exec redis redis-cli ping
```

## Configuration

### Environment Variables

#### Application Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Application port (default: 3000)
- `LOG_LEVEL` - Logging level (debug/info/warn/error)
- `OPENAI_BSM_KEY` - OpenAI API key (required)
- `ADMIN_TOKEN` - Admin authentication token (required)

#### MySQL Variables
- `MYSQL_HOST` - MySQL hostname (default: mysql)
- `MYSQL_PORT` - MySQL port (default: 3306)
- `MYSQL_USER` - MySQL username (default: bsm_user)
- `MYSQL_PASSWORD` - MySQL password (required)
- `MYSQL_ROOT_PASSWORD` - MySQL root password (required)
- `MYSQL_DATABASE` - Database name (default: bsm_db)

#### Redis Variables
- `REDIS_URL` - Redis connection URL (default: redis://redis:6379)

### Service Dependencies

The `docker-compose.mysql.yml` file defines service dependencies:

```yaml
depends_on:
  mysql:
    condition: service_healthy
  redis:
    condition: service_healthy
```

This ensures:
- MySQL is healthy before starting the app
- Redis is healthy before starting the app
- Proper startup order

### Health Checks

Each service includes health checks:

**App:**
```yaml
healthcheck:
  test: ["CMD", "node", "-e", "..."]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

**MySQL:**
```yaml
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 30s
```

**Redis:**
```yaml
healthcheck:
  test: ["CMD", "redis-cli", "ping"]
  interval: 10s
  timeout: 5s
  retries: 3
```

## Usage

### Common Commands

```bash
# Start services
docker-compose -f docker-compose.mysql.yml up -d

# Stop services
docker-compose -f docker-compose.mysql.yml down

# Restart a service
docker-compose -f docker-compose.mysql.yml restart app

# View logs
docker-compose -f docker-compose.mysql.yml logs -f app
docker-compose -f docker-compose.mysql.yml logs -f mysql

# Execute commands in containers
docker-compose -f docker-compose.mysql.yml exec app sh
docker-compose -f docker-compose.mysql.yml exec mysql bash

# Rebuild and restart
docker-compose -f docker-compose.mysql.yml up -d --build app
```

### Working with MySQL

#### Connect to MySQL

```bash
# Using docker-compose exec
docker-compose -f docker-compose.mysql.yml exec mysql \
  mysql -u bsm_user -p bsm_db

# Using mysql client (if installed locally)
mysql -h 127.0.0.1 -P 3306 -u bsm_user -p bsm_db
```

#### Common MySQL Commands

```sql
-- Show databases
SHOW DATABASES;

-- Use the BSM database
USE bsm_db;

-- Show tables
SHOW TABLES;

-- Create a sample table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (username, email) 
VALUES ('test_user', 'test@example.com');

-- Query data
SELECT * FROM users;
```

#### Backup and Restore

**Backup:**
```bash
# Backup database to file
docker-compose -f docker-compose.mysql.yml exec mysql \
  mysqldump -u bsm_user -p bsm_db > backup.sql
```

**Restore:**
```bash
# Restore database from file
docker-compose -f docker-compose.mysql.yml exec -T mysql \
  mysql -u bsm_user -p bsm_db < backup.sql
```

### Working with Redis

```bash
# Connect to Redis CLI
docker-compose -f docker-compose.mysql.yml exec redis redis-cli

# Redis commands
> PING
> SET test_key "test_value"
> GET test_key
> KEYS *
> FLUSHALL  # Clear all data (careful!)
```

## Data Persistence

### Volumes

The configuration uses named volumes for data persistence:

- `bsm-mysql-data` - MySQL database files
- `bsm-redis-data` - Redis persistent storage
- `bsm-node-modules` - Node.js dependencies

### Volume Management

```bash
# List volumes
docker volume ls | grep bsm

# Inspect a volume
docker volume inspect bsm-mysql-data

# Remove volumes (⚠️ DATA LOSS!)
docker-compose -f docker-compose.mysql.yml down -v

# Backup a volume
docker run --rm -v bsm-mysql-data:/data -v $(pwd):/backup \
  alpine tar czf /backup/mysql-backup.tar.gz -C /data .

# Restore a volume
docker run --rm -v bsm-mysql-data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/mysql-backup.tar.gz -C /data
```

## Networking

### Container Network

All services communicate via the `bsm-network` bridge network:

```bash
# Inspect network
docker network inspect bsm-network

# View connected containers
docker network inspect bsm-network -f '{{range .Containers}}{{.Name}} {{end}}'
```

### Service Discovery

Containers can reach each other using service names:

- From app to MySQL: `mysql://bsm_user:password@mysql:3306/bsm_db`
- From app to Redis: `redis://redis:6379`

### Port Mapping

External → Internal port mappings:

- `3000:3000` - Application HTTP
- `3306:3306` - MySQL
- `6379:6379` - Redis

## Troubleshooting

### Service Won't Start

```bash
# Check service status
docker-compose -f docker-compose.mysql.yml ps

# View detailed logs
docker-compose -f docker-compose.mysql.yml logs mysql

# Check health status
docker inspect bsm-mysql --format='{{json .State.Health}}'
```

### MySQL Connection Errors

**Error: "Can't connect to MySQL server"**
```bash
# Verify MySQL is running
docker-compose -f docker-compose.mysql.yml ps mysql

# Check MySQL logs
docker-compose -f docker-compose.mysql.yml logs mysql

# Verify credentials
docker-compose -f docker-compose.mysql.yml exec mysql \
  mysql -u root -p -e "SELECT user, host FROM mysql.user;"
```

**Error: "Access denied for user"**
- Verify `MYSQL_PASSWORD` matches in both service and app
- Check username is correct (`bsm_user` by default)
- Ensure database exists (`bsm_db` by default)

### Port Already in Use

```bash
# Find process using port 3306
lsof -i :3306
# or
netstat -ano | findstr :3306  # Windows

# Kill the process or change port in docker-compose.mysql.yml
```

### Reset Everything

```bash
# Stop and remove containers, networks, volumes
docker-compose -f docker-compose.mysql.yml down -v

# Remove all images
docker-compose -f docker-compose.mysql.yml down --rmi all

# Start fresh
docker-compose -f docker-compose.mysql.yml up -d --build
```

## Production Considerations

### Security

1. **Use Strong Passwords**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32
   ```

2. **Environment Variables**
   - Never commit `.env` files with real credentials
   - Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
   - Set environment variables directly in production

3. **Network Security**
   - Don't expose MySQL port (3306) to the internet
   - Use internal Docker networks only
   - Implement firewall rules

4. **Database Users**
   - Create separate users with minimal privileges
   - Avoid using root user in application
   - Implement read-only users where appropriate

### Performance

1. **MySQL Configuration**
   - Tune `my.cnf` for your workload
   - Adjust buffer pool size
   - Configure connection pooling

2. **Resource Limits**
   ```yaml
   mysql:
     deploy:
       resources:
         limits:
           cpus: '2'
           memory: 2G
         reservations:
           memory: 1G
   ```

3. **Monitoring**
   - Set up MySQL slow query log
   - Monitor connection pool usage
   - Track cache hit rates

### Backups

1. **Automated Backups**
   ```bash
   # Cron job for daily backups
   0 2 * * * docker-compose -f /path/to/docker-compose.mysql.yml exec -T mysql \
     mysqldump -u bsm_user -p$MYSQL_PASSWORD --all-databases > \
     /backups/mysql-$(date +\%Y\%m\%d).sql
   ```

2. **Backup Strategy**
   - Daily full backups
   - Transaction log backups for point-in-time recovery
   - Test restore procedures regularly
   - Store backups off-site

### High Availability

For production, consider:
- MySQL replication (master-slave)
- MySQL Cluster (NDB)
- Managed MySQL services (AWS RDS, Azure Database, etc.)
- Load balancers for multiple app instances

## Comparison with PostgreSQL

| Feature | MySQL | PostgreSQL |
|---------|-------|------------|
| File | `docker-compose.mysql.yml` | `docker-compose.yml.example` |
| Version | 8.0 | 16 |
| Port | 3306 | 5432 |
| Image | `mysql:8.0` | `postgres:16-alpine` |
| Auth | mysql_native_password | md5/scram |

**When to use MySQL:**
- Need specific MySQL features
- Existing MySQL expertise/infrastructure
- Following Microsoft's tutorial examples

**When to use PostgreSQL:**
- Need advanced SQL features
- Require better JSON support
- Want more permissive license

## Additional Resources

### Microsoft Documentation
- [Multi-Container Apps Tutorial](https://learn.microsoft.com/en-us/visualstudio/docker/tutorials/tutorial-multi-container-app-mysql)
- [Docker Compose Tutorial](https://learn.microsoft.com/en-us/visualstudio/containers/tutorial-multicontainer)
- [Container Development Docs](https://learn.microsoft.com/en-us/visualstudio/containers/)

### Docker Documentation
- [Docker Compose](https://docs.docker.com/compose/)
- [MySQL Official Image](https://hub.docker.com/_/mysql)
- [Redis Official Image](https://hub.docker.com/_/redis)
- [Multi-Container Apps](https://docs.docker.com/get-started/workshop/07_multi_container/)

### MySQL Resources
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [MySQL Best Practices](https://dev.mysql.com/doc/refman/8.0/en/best-practices.html)

## Support

For issues specific to the BSM platform:
- GitHub Issues: https://github.com/LexBANK/BSM/issues
- Documentation: https://github.com/LexBANK/BSM/docs
- Telegram Support: https://t.me/LexFixBot

For Docker/MySQL issues:
- Docker Desktop Issues: https://github.com/docker/for-mac/issues
- MySQL Community: https://forums.mysql.com/
- Stack Overflow: Tag your questions with `docker`, `docker-compose`, `mysql`

## License

This configuration and documentation are part of the BSM Platform.
See [LICENSE](../LICENSE) for details.
