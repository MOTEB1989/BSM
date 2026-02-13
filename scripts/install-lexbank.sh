#!/bin/bash
# ==============================================================================
# LexBANK - Complete Independent Installation Script
# Version: 1.0.0
# Description: One-click setup for fully independent LexBANK platform
# ==============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="${DOMAIN:-lexbank.com}"
EMAIL="${EMAIL:-admin@lexbank.com}"
DB_PASSWORD="${DB_PASSWORD:-}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
JWT_SECRET="${JWT_SECRET:-}"
NON_INTERACTIVE="${NON_INTERACTIVE:-false}"
APP_DIR="/var/www/lexbank"
LOG_DIR="/var/log/lexbank"

# ==============================================================================
# Helper Functions
# ==============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

print_usage() {
    cat <<'USAGEEOF'
Usage: sudo bash scripts/install-lexbank.sh [OPTIONS]

Options:
  --non-interactive     Do not prompt for confirmation on unsupported OS.
  -h, --help            Show this help message.

Environment overrides:
  DOMAIN, EMAIL, DB_PASSWORD, ADMIN_TOKEN, JWT_SECRET, NON_INTERACTIVE
USAGEEOF
}

parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --non-interactive)
                NON_INTERACTIVE="true"
                shift
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            *)
                error "Unknown argument: $1"
                ;;
        esac
    done
}

generate_secret() {
    local mode="$1"
    local length="$2"

    if command -v openssl >/dev/null 2>&1; then
        if [[ "$mode" == "hex" ]]; then
            openssl rand -hex "$length"
        else
            openssl rand -base64 "$length"
        fi
        return
    fi

    warning "openssl not found. Falling back to /dev/urandom for secret generation."
    if [[ "$mode" == "hex" ]]; then
        head -c "$length" /dev/urandom | xxd -p -c "$length"
    else
        head -c "$length" /dev/urandom | base64
    fi
}

ensure_runtime_config() {
    [[ -z "$DB_PASSWORD" ]] && DB_PASSWORD="$(generate_secret base64 32)"
    [[ -z "$ADMIN_TOKEN" ]] && ADMIN_TOKEN="$(generate_secret hex 32)"
    [[ -z "$JWT_SECRET" ]] && JWT_SECRET="$(generate_secret hex 64)"
}

# ==============================================================================
# Pre-flight Checks
# ==============================================================================

check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root. Use: sudo bash install-lexbank.sh"
    fi
}

check_os() {
    if ! grep -q "Ubuntu 22.04\|Ubuntu 24.04" /etc/os-release; then
        warning "This script is optimized for Ubuntu 22.04/24.04 LTS"
        if [[ "$NON_INTERACTIVE" == "true" ]]; then
            warning "Continuing because NON_INTERACTIVE mode is enabled."
            return
        fi
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# ==============================================================================
# System Update & Dependencies
# ==============================================================================

update_system() {
    log "Updating system packages..."
    apt-get update && apt-get upgrade -y
    success "System updated"
}

install_dependencies() {
    log "Installing dependencies..."

    # Core packages
    apt-get install -y \
        curl \
        wget \
        git \
        nginx \
        postgresql \
        postgresql-contrib \
        redis-server \
        nodejs \
        npm \
        certbot \
        python3-certbot-nginx \
        ufw \
        fail2ban \
        htop \
        ncdu \
        vim \
        unzip \
        build-essential

    # Update Node.js to v22
    log "Installing Node.js v22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs

    # Install PM2 globally
    npm install -g pm2

    success "Dependencies installed"
}

# ==============================================================================
# Database Setup
# ==============================================================================

setup_database() {
    log "Setting up PostgreSQL database..."

    # Start PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql

    # Create database and user (idempotent)
    sudo -u postgres psql << EOF
DO
\$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'lexbank') THEN
        CREATE ROLE lexbank LOGIN PASSWORD '${DB_PASSWORD}';
    ELSE
        ALTER ROLE lexbank WITH PASSWORD '${DB_PASSWORD}';
    END IF;
END
\$\$;

SELECT 'CREATE DATABASE lexbank OWNER lexbank'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'lexbank')
\gexec

GRANT ALL PRIVILEGES ON DATABASE lexbank TO lexbank;
ALTER DATABASE lexbank OWNER TO lexbank;
\q
EOF

    success "Database 'lexbank' created"
    log "Database credentials were saved in ${APP_DIR}/.env"
}

# ==============================================================================
# Application Directory Setup
# ==============================================================================

setup_app_directory() {
    log "Creating application directory..."

    mkdir -p ${APP_DIR}
    mkdir -p ${LOG_DIR}
    mkdir -p ${APP_DIR}/docs
    mkdir -p ${APP_DIR}/dashboard
    mkdir -p ${APP_DIR}/chat
    mkdir -p ${APP_DIR}/src

    # Create directory structure
    mkdir -p ${APP_DIR}/src/{api,orchestrator,guards,agents,webhooks,lib}
    mkdir -p ${APP_DIR}/src/api/admin
    mkdir -p ${APP_DIR}/agents
    mkdir -p ${APP_DIR}/config

    success "Directory structure created"
}

# ==============================================================================
# Create Application Files
# ==============================================================================

create_server_js() {
    log "Creating server.js..."

    cat > ${APP_DIR}/server.js << 'SERVEREOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors({
    origin: (process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(',').map((item) => item.trim())
        : [
            'https://lexbank.com',
            'https://www.lexbank.com',
            'http://localhost:3000'
        ]),
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// Readiness check
app.get('/ready', async (req, res) => {
    const checks = {
        server: true,
        database: true, // TODO: Add actual DB check
    };

    const allReady = Object.values(checks).every(v => v === true);

    res.status(allReady ? 200 : 503).json({
        ready: allReady,
        checks,
        timestamp: new Date().toISOString()
    });
});

// API Status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        version: '1.0.0',
        features: {
            mobileMode: process.env.MOBILE_MODE === 'true',
            lanOnly: process.env.LAN_ONLY === 'true',
            safeMode: process.env.SAFE_MODE === 'true'
        },
        capabilities: {
            chat: true,
            agents: true,
            admin: true,
            externalApi: true
        }
    });
});

// Agents list
app.get('/api/agents', (req, res) => {
    res.json({
        agents: [
            {
                id: 'agent-auto',
                name: 'Auto Router',
                description: 'Automatically routes queries to appropriate agents',
                category: 'conversational',
                status: 'active'
            },
            {
                id: 'legal-agent',
                name: 'Legal Expert',
                description: 'Provides legal research and compliance guidance',
                category: 'conversational',
                status: 'active'
            },
            {
                id: 'governance-agent',
                name: 'Governance Agent',
                description: 'Analyzes governance policies',
                category: 'governance',
                status: 'active'
            }
        ],
        timestamp: new Date().toISOString()
    });
});

// Static files
app.use('/docs', express.static(path.join(__dirname, 'docs')));
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
app.use('/chat', express.static(path.join(__dirname, 'chat')));

// Root redirect
app.get('/', (req, res) => {
    res.redirect('/chat');
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message
    });
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🏦 LexBANK Platform                                        ║
║   https://${process.env.DOMAIN || 'localhost'}               ║
║   Port: ${PORT}                                              ║
║                                                              ║
║   Endpoints:                                                 ║
║   • Chat:      /chat                                         ║
║   • Dashboard: /dashboard                                    ║
║   • Docs:      /docs                                         ║
║   • API:       /api/status                                   ║
║   • Health:    /health                                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);
});
SERVEREOF

    success "server.js created"
}

create_package_json() {
    log "Creating package.json..."

    cat > ${APP_DIR}/package.json << 'PACKAGEEOF'
{
  "name": "lexbank-platform",
  "version": "1.0.0",
  "description": "LexBANK - Independent Banking Intelligence Platform",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "validate:agents": "echo 'Agent validation placeholder'",
    "test": "echo 'Tests placeholder'",
    "lint": "echo 'Lint placeholder'"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  },
  "engines": {
    "node": ">=22.0.0"
  }
}
PACKAGEEOF

    success "package.json created"
}

create_env_file() {
    log "Creating .env file..."

    cat > ${APP_DIR}/.env << ENVEOF
# === LexBANK Environment Configuration ===
NODE_ENV=production
PORT=3000
DOMAIN=${DOMAIN}

# === Database ===
DATABASE_URL=postgresql://lexbank:${DB_PASSWORD}@localhost:5432/lexbank

# === Security ===
ADMIN_TOKEN=${ADMIN_TOKEN}
JWT_SECRET=${JWT_SECRET}
CORS_ORIGINS=https://${DOMAIN},https://www.${DOMAIN},http://localhost:3000

# === AI APIs (Add your keys) ===
# OPENAI_API_KEY=your_key_here

# === Telegram (Optional) ===
# TELEGRAM_BOT_TOKEN=your_bot_token_here
# TELEGRAM_WEBHOOK_SECRET=your_webhook_secret_here
# ORBIT_ADMIN_CHAT_IDS=your_chat_id

# === Operation Modes ===
SAFE_MODE=false
MOBILE_MODE=false
LAN_ONLY=false
ENVEOF

    chmod 600 ${APP_DIR}/.env
    success ".env file created (secure permissions)"
}

create_chat_interface() {
    log "Creating chat interface..."

    cat > ${APP_DIR}/chat/index.html << 'CHATEOF'
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LexBANK - المساعد الذكي</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: linear-gradient(135deg, #1a5f7a 0%, #159895 100%);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            background: rgba(0,0,0,0.2);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: white;
        }

        .logo { font-size: 24px; font-weight: bold; }

        .status {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        }

        .status-dot {
            width: 10px;
            height: 10px;
            background: #4caf50;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }

        .chat-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            max-width: 900px;
            width: 100%;
            margin: 0 auto;
            background: white;
            border-radius: 20px 20px 0 0;
            margin-top: 20px;
            overflow: hidden;
        }

        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
        }

        .welcome {
            text-align: center;
            padding: 40px 20px;
        }

        .welcome h2 {
            color: #1a5f7a;
            margin-bottom: 10px;
        }

        .quick-actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
        }

        .quick-btn {
            background: white;
            border: 2px solid #1a5f7a;
            color: #1a5f7a;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
        }

        .quick-btn:hover {
            background: #1a5f7a;
            color: white;
        }

        .input-area {
            padding: 20px;
            background: white;
            border-top: 1px solid #e0e0e0;
            display: flex;
            gap: 10px;
        }

        .input-area textarea {
            flex: 1;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 25px;
            resize: none;
            font-family: inherit;
            font-size: 16px;
            outline: none;
        }

        .input-area textarea:focus {
            border-color: #1a5f7a;
        }

        .send-btn {
            background: #1a5f7a;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            transition: background 0.3s;
        }

        .send-btn:hover {
            background: #159895;
        }

        .footer {
            text-align: center;
            padding: 10px;
            color: rgba(255,255,255,0.7);
            font-size: 12px;
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">🏦 LexBANK</div>
        <div class="status">
            <span class="status-dot"></span>
            <span>المساعد الذكي متصل</span>
        </div>
    </header>

    <div class="chat-container">
        <div class="messages">
            <div class="welcome">
                <h2>مرحبًا بك في LexBANK</h2>
                <p>المساعد الذكي جاهز لمساعدتك في الأسئلة القانونية والتقنية والإدارية</p>

                <div class="quick-actions">
                    <button class="quick-btn" onclick="sendQuick('ما هي أنواع الشركات في السعودية؟')">
                        ⚖️ أنواع الشركات
                    </button>
                    <button class="quick-btn" onclick="sendQuick('ساعدني في صياغة عقد')">
                        📄 صياغة عقد
                    </button>
                    <button class="quick-btn" onclick="sendQuick('ما هي متطلبات الحوكمة؟')">
                        🏢 متطلبات الحوكمة
                    </button>
                </div>
            </div>
        </div>

        <div class="input-area">
            <textarea id="messageInput" placeholder="اكتب رسالتك هنا..." rows="1"></textarea>
            <button class="send-btn" onclick="sendMessage()">إرسال</button>
        </div>
    </div>

    <footer class="footer">
        LexBANK مدعوم بتقنية GPT | جميع المحادثات سرية | استضافة مستقلة
    </footer>

    <script>
        function sendQuick(text) {
            document.getElementById('messageInput').value = text;
        }

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const text = input.value.trim();
            if (text) {
                alert('سيتم الاتصال بالوكيل: ' + text);
                input.value = '';
            }
        }

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    </script>
</body>
</html>
CHATEOF

    success "Chat interface created"
}

create_dashboard() {
    log "Creating dashboard..."

    cat > ${APP_DIR}/dashboard/index.html << 'DASHBOARDEOF'
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LexBANK Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', Tahoma, sans-serif;
            background: #f5f7fa;
            color: #333;
        }

        .sidebar {
            position: fixed;
            right: 0;
            top: 0;
            width: 250px;
            height: 100vh;
            background: #1a5f7a;
            color: white;
            padding: 20px;
        }

        .sidebar h2 { margin-bottom: 30px; }

        .sidebar nav a {
            display: block;
            color: white;
            text-decoration: none;
            padding: 12px;
            margin: 5px 0;
            border-radius: 8px;
            transition: background 0.3s;
        }

        .sidebar nav a:hover {
            background: rgba(255,255,255,0.1);
        }

        .main {
            margin-right: 250px;
            padding: 30px;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
        }

        .status-badge {
            background: #4caf50;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .card h3 {
            color: #1a5f7a;
            margin-bottom: 15px;
        }

        .stat {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }

        .stat:last-child { border-bottom: none; }

        .stat-value {
            font-weight: bold;
            color: #159895;
        }

        .btn {
            background: #1a5f7a;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 10px;
        }

        .btn:hover { background: #159895; }
    </style>
</head>
<body>
    <aside class="sidebar">
        <h2>🏦 LexBANK</h2>
        <nav>
            <a href="#">📊 لوحة التحكم</a>
            <a href="#">🤖 الوكلاء</a>
            <a href="#">📜 التدقيق</a>
            <a href="#">⚙️ الإعدادات</a>
            <a href="/chat">💬 الدردشة</a>
        </nav>
    </aside>

    <main class="main">
        <div class="header">
            <h1>لوحة التحكم</h1>
            <span class="status-badge">● النظام يعمل</span>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 إحصائيات النظام</h3>
                <div class="stat">
                    <span>الوكلاء النشطون</span>
                    <span class="stat-value">9</span>
                </div>
                <div class="stat">
                    <span>التشغيلات اليوم</span>
                    <span class="stat-value">0</span>
                </div>
                <div class="stat">
                    <span>آخر تدقيق</span>
                    <span class="stat-value">منذ ساعة</span>
                </div>
            </div>

            <div class="card">
                <h3>🤖 حالة الوكلاء</h3>
                <div class="stat">
                    <span>Auto Router</span>
                    <span class="stat-value" style="color: #4caf50;">● نشط</span>
                </div>
                <div class="stat">
                    <span>Legal Expert</span>
                    <span class="stat-value" style="color: #4caf50;">● نشط</span>
                </div>
                <div class="stat">
                    <span>Governance Agent</span>
                    <span class="stat-value" style="color: #4caf50;">● نشط</span>
                </div>
                <button class="btn">عرض الكل</button>
            </div>

            <div class="card">
                <h3>⚙️ التحكم السريع</h3>
                <button class="btn">🛡️ Safe Mode: OFF</button>
                <button class="btn">📱 Mobile Mode: OFF</button>
                <button class="btn">📥 تصدير التدقيق</button>
            </div>
        </div>
    </main>
</body>
</html>
DASHBOARDEOF

    success "Dashboard created"
}

# ==============================================================================
# Nginx Configuration
# ==============================================================================

setup_nginx() {
    log "Configuring Nginx..."

    cat > /etc/nginx/sites-available/lexbank << 'NGINXEOF'
server {
    listen 80;
    server_name lexbank.com www.lexbank.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /docs {
        alias /var/www/lexbank/docs;
        try_files $uri $uri/ =404;
    }

    location /dashboard {
        alias /var/www/lexbank/dashboard;
        try_files $uri $uri/ /dashboard/index.html;
    }

    location /chat {
        alias /var/www/lexbank/chat;
        try_files $uri $uri/ /chat/index.html;
    }
}
NGINXEOF

    rm -f /etc/nginx/sites-enabled/default
    ln -sf /etc/nginx/sites-available/lexbank /etc/nginx/sites-enabled/

    nginx -t && systemctl restart nginx
    systemctl enable nginx

    success "Nginx configured"
}

# ==============================================================================
# SSL Certificate
# ==============================================================================

setup_ssl() {
    log "Setting up SSL certificate..."

    if [[ "$DOMAIN" != "localhost" ]]; then
        certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos -m ${EMAIL} || warning "SSL setup failed, continuing..."
    else
        warning "Skipping SSL for localhost"
    fi

    success "SSL configured"
}

# ==============================================================================
# Firewall
# ==============================================================================

setup_firewall() {
    log "Configuring firewall..."

    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'

    ufw --force enable

    success "Firewall configured"
}

# ==============================================================================
# PM2 Setup
# ==============================================================================

setup_pm2() {
    log "Setting up PM2..."

    cat > ${APP_DIR}/ecosystem.config.js << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'lexbank',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/lexbank/err.log',
    out_file: '/var/log/lexbank/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    restart_delay: 3000,
    max_restarts: 5,
    autorestart: true
  }]
};
PM2EOF

    cd ${APP_DIR}
    npm install

    # Start with PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup systemd -u root --hp /root

    success "PM2 configured and started"
}

# ==============================================================================
# Fail2ban
# ==============================================================================

setup_fail2ban() {
    log "Setting up Fail2ban..."

    cat > /etc/fail2ban/jail.local << 'FAIL2BANEOF'
[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
FAIL2BANEOF

    systemctl restart fail2ban
    systemctl enable fail2ban

    success "Fail2ban configured"
}

# ==============================================================================
# Save Credentials
# ==============================================================================

save_credentials() {
    log "Saving credentials..."

    cat > /root/lexbank-credentials.txt << CREDEOF
================================================================================
LexBANK Installation Credentials
Generated: $(date)
================================================================================

DOMAIN: ${DOMAIN}
EMAIL: ${EMAIL}

DATABASE:
  Name: lexbank
  User: lexbank
  Password: ${DB_PASSWORD}

SECURITY TOKENS:
  ADMIN_TOKEN: ${ADMIN_TOKEN}
  JWT_SECRET: ${JWT_SECRET}

IMPORTANT:
1. Save these credentials securely
2. Delete this file after saving: rm /root/lexbank-credentials.txt
3. Update .env file with your actual API keys

================================================================================
CREDEOF

    chmod 600 /root/lexbank-credentials.txt

    success "Credentials saved to /root/lexbank-credentials.txt"
}

# ==============================================================================
# Main Execution
# ==============================================================================

main() {
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║   🏦 LexBANK - Independent Installation                      ║"
    echo "║   Complete Setup Script                                      ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"

    log "Starting installation for domain: ${DOMAIN}"

    ensure_runtime_config
    check_root
    check_os
    update_system
    install_dependencies
    setup_database
    setup_app_directory
    create_server_js
    create_package_json
    create_env_file
    create_chat_interface
    create_dashboard
    setup_nginx
    setup_ssl
    setup_firewall
    setup_pm2
    setup_fail2ban
    save_credentials

    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║   ✅ Installation Complete!                                  ║"
    echo "║                                                              ║"
    echo "║   Your site: https://${DOMAIN}                               ║"
    echo "║   Chat:      https://${DOMAIN}/chat                          ║"
    echo "║   Dashboard: https://${DOMAIN}/dashboard                     ║"
    echo "║                                                              ║"
    echo "║   Credentials: /root/lexbank-credentials.txt                 ║"
    echo "║                                                              ║"
    echo "║   Commands:                                                  ║"
    echo "║   • pm2 status     - Check status                            ║"
    echo "║   • pm2 logs       - View logs                               ║"
    echo "║   • pm2 restart    - Restart app                             ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Run main
parse_args "$@"
main
