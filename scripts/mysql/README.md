# MySQL Scripts

This directory contains MySQL initialization and utility scripts for the BSM Platform.

## Files

### init.sql
Database initialization script that runs automatically when MySQL container starts for the first time.

**Features:**
- Creates database schema with proper UTF-8 encoding
- Defines tables for users, sessions, agents, executions, audit logs, and knowledge documents
- Sets up indexes and foreign keys for optimal performance
- Creates useful views for common queries
- Includes stored procedures for logging agent executions
- Inserts sample data for development

**Usage:**

The script is automatically executed when you start the MySQL container. To enable it, uncomment the volume mount in `docker-compose.mysql.yml`:

```yaml
mysql:
  volumes:
    - mysql-data:/var/lib/mysql
    - ./scripts/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro  # Uncomment this line
```

**Manual Execution:**

If you need to run the script manually:

```bash
# Copy script into container
docker cp scripts/mysql/init.sql bsm-mysql:/tmp/init.sql

# Execute script
docker-compose -f docker-compose.mysql.yml exec mysql \
  mysql -u root -p bsm_db < /tmp/init.sql
```

## Database Schema

### Tables

1. **users** - User accounts and authentication
   - `id` (PK), `username`, `email`, `role`, timestamps

2. **sessions** - User session management
   - `id` (PK), `user_id` (FK), `data` (JSON), `expires_at`, timestamps

3. **agents** - Agent configurations
   - `id` (PK), `name`, `description`, `config` (JSON), `enabled`, timestamps

4. **agent_executions** - Agent execution logs
   - `id` (PK), `agent_id` (FK), `user_id` (FK), `input`, `output`, `status`, `duration_ms`, timestamps

5. **audit_logs** - Comprehensive audit trail
   - `id` (PK), `event_type`, `action`, `user_id` (FK), `details` (JSON), `correlation_id`, timestamps

6. **knowledge_documents** - Knowledge base documents
   - `id` (PK), `title`, `content` (LONGTEXT), `category`, `tags` (JSON), `metadata` (JSON), timestamps

### Views

1. **active_agents** - Shows only enabled agents
2. **recent_executions** - Last 100 agent executions with join data

### Stored Procedures

1. **log_agent_execution** - Create new agent execution record
2. **complete_agent_execution** - Update execution with results

## Security Notes

⚠️ **Important:**
- The default passwords in this configuration are for **development only**
- **Never** use default passwords in production
- Change `MYSQL_ROOT_PASSWORD` and `MYSQL_PASSWORD` before deploying
- Restrict MySQL network access in production
- Use strong, randomly generated passwords

## Customization

To customize the database schema:

1. Edit `init.sql` with your changes
2. Stop and remove the MySQL container and volume:
   ```bash
   docker-compose -f docker-compose.mysql.yml down -v
   ```
3. Start fresh:
   ```bash
   docker-compose -f docker-compose.mysql.yml up -d
   ```

## Troubleshooting

### Script Not Running

If the initialization script doesn't run:

1. Ensure volume mount is uncommented in docker-compose.mysql.yml
2. Remove existing volume: `docker volume rm bsm-mysql-data`
3. Start container: `docker-compose -f docker-compose.mysql.yml up -d`

### Check Execution Logs

```bash
docker-compose -f docker-compose.mysql.yml logs mysql | grep init
```

### Manual Verification

```bash
# Connect to MySQL
docker-compose -f docker-compose.mysql.yml exec mysql mysql -u bsm_user -p bsm_db

# Check tables
SHOW TABLES;

# Check a specific table structure
DESCRIBE users;
```

## Additional Resources

- [MySQL Official Documentation](https://dev.mysql.com/doc/)
- [Docker MySQL Image](https://hub.docker.com/_/mysql)
- [Microsoft Multi-Container Tutorial](https://learn.microsoft.com/en-us/visualstudio/docker/tutorials/tutorial-multi-container-app-mysql)
- [Main Documentation](../../docs/MYSQL-MULTI-CONTAINER.md)
