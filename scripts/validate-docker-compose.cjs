const fs = require('fs');
const yaml = require('yaml');

// Validate docker-compose.mysql.yml
try {
  const content = fs.readFileSync('docker-compose.mysql.yml', 'utf8');
  const doc = yaml.parse(content);
  
  console.log('✓ docker-compose.mysql.yml is valid YAML');
  console.log('Services:', Object.keys(doc.services).join(', '));
  console.log('Volumes:', Object.keys(doc.volumes).join(', '));
  console.log('Networks:', Object.keys(doc.networks).join(', '));
  console.log('');
  
  // Check required services
  const requiredServices = ['app', 'mysql', 'redis'];
  const missingServices = requiredServices.filter(s => !doc.services[s]);
  if (missingServices.length > 0) {
    throw new Error('Missing required services: ' + missingServices.join(', '));
  }
  
  console.log('✓ All required services present');
  
  // Check MySQL configuration
  const mysql = doc.services.mysql;
  if (!mysql.environment) {
    throw new Error('MySQL service missing environment variables');
  }
  
  // Check for MYSQL_ROOT_PASSWORD in either array or object format
  let hasRootPassword = false;
  if (Array.isArray(mysql.environment)) {
    hasRootPassword = mysql.environment.some(env => 
      typeof env === 'string' && env.startsWith('MYSQL_ROOT_PASSWORD=')
    );
  } else if (typeof mysql.environment === 'object') {
    hasRootPassword = !!mysql.environment.MYSQL_ROOT_PASSWORD;
  }
  
  if (!hasRootPassword) {
    throw new Error('MySQL service missing MYSQL_ROOT_PASSWORD');
  }
  
  if (!mysql.healthcheck) {
    throw new Error('MySQL service missing healthcheck');
  }
  
  console.log('✓ MySQL service properly configured');
  
  // Check app dependencies
  const app = doc.services.app;
  if (!app.depends_on || !app.depends_on.mysql || !app.depends_on.redis) {
    throw new Error('App service missing proper dependencies');
  }
  
  console.log('✓ App service dependencies configured');
  console.log('');
  console.log('✅ docker-compose.mysql.yml validation passed');
  
} catch(e) {
  console.error('✗ Error:', e.message);
  process.exit(1);
}
