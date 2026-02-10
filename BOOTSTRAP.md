# BSM Bootstrap Guide

Automated setup scripts for the BSM (Business Service Management) platform. These scripts handle installation of dependencies, environment configuration, and initial setup.

## Quick Start

### Linux/macOS

```bash
# Clone the repository
git clone https://github.com/LexBANK/BSM.git
cd BSM

# Run bootstrap script
./scripts/bootstrap.sh
```

### Windows

```powershell
# Clone the repository
git clone https://github.com/LexBANK/BSM.git
cd BSM

# Run bootstrap script (as Administrator)
.\scripts\bootstrap.ps1
```

## What the Bootstrap Scripts Do

1. **Verify Project Structure** - Ensures you're in the correct directory with `package.json`
2. **Check/Install Node.js** - Verifies Node.js 18+ is installed, installs if missing
3. **Setup Environment** - Creates `.env` from `.env.example` template
4. **Install Dependencies** - Runs `npm ci` (or `npm install` as fallback)
5. **Validate Configuration** - Runs `npm run validate` to check agent configs
6. **Start Development Server** - Optionally starts `npm run dev`

## Requirements

### All Platforms
- **Node.js** 18+ (will be installed by script if missing)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

### Linux
- Package manager: `apt-get`, `yum`, or `pacman`
- `curl` (usually pre-installed)
- `sudo` access (for system-wide Node.js installation)

### macOS
- **Homebrew** recommended (will be installed by script if missing)
- Xcode Command Line Tools (usually installed with Homebrew)

### Windows
- **Windows 10/11**
- **PowerShell 5.1+**
- **winget** (App Installer from Microsoft Store)
- **Administrator privileges** (for installing Node.js)

## Script Options

### Linux/macOS (`bootstrap.sh`)

```bash
./scripts/bootstrap.sh [OPTIONS]

Options:
  --skip-deps    Skip dependency installation (Node.js, npm)
  --no-dev       Don't prompt to start dev server after setup
```

**Examples:**

```bash
# Standard bootstrap with all steps
./scripts/bootstrap.sh

# Skip dependency checks (if you already have Node.js)
./scripts/bootstrap.sh --skip-deps

# Setup only, don't start server
./scripts/bootstrap.sh --no-dev

# Combined options
./scripts/bootstrap.sh --skip-deps --no-dev
```

### Windows (`bootstrap.ps1`)

```powershell
.\scripts\bootstrap.ps1 [-SkipDeps] [-NoDev]

Options:
  -SkipDeps    Skip dependency installation (Node.js, npm)
  -NoDev       Don't prompt to start dev server after setup
```

**Examples:**

```powershell
# Standard bootstrap with all steps
.\scripts\bootstrap.ps1

# Skip dependency checks (if you already have Node.js)
.\scripts\bootstrap.ps1 -SkipDeps

# Setup only, don't start server
.\scripts\bootstrap.ps1 -NoDev

# Combined options
.\scripts\bootstrap.ps1 -SkipDeps -NoDev
```

## Manual Setup (Alternative)

If you prefer manual setup or the scripts don't work for your environment:

### 1. Install Node.js

Download and install Node.js 18+ from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node -v   # Should show v18.0.0 or higher
npm -v    # Should show version number
```

### 2. Clone Repository

```bash
git clone https://github.com/LexBANK/BSM.git
cd BSM
```

### 3. Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your preferred editor
nano .env   # or vim, code, notepad, etc.
```

**Required configurations in `.env`:**

```bash
# At least ONE OpenAI key is required
OPENAI_BSM_KEY=sk-...           # Preferred
# OR
OPENAI_BSU_KEY=sk-...           # Alternative
# OR
OPENAI_API_KEY=sk-...           # Fallback

# Change this from default!
ADMIN_TOKEN=your-secure-token-here
```

**Optional configurations:**

```bash
PORT=3000                       # Server port
LOG_LEVEL=info                  # Logging level
NODE_ENV=development            # Environment
OPENAI_MODEL=gpt-4o-mini       # AI model to use
```

### 4. Install Dependencies

```bash
npm ci
```

### 5. Validate Configuration

```bash
npm run validate
```

### 6. Start Development Server

```bash
npm run dev
```

## Post-Setup

After successful bootstrap, you can access:

- **API Health Check**: http://localhost:3000/api/health
- **Chat Interface**: http://localhost:3000/src/chat/
- **Admin Dashboard**: http://localhost:3000/src/admin/

## Available Commands

```bash
# Development server (auto-reload)
npm run dev

# Production server
npm start

# Validate agent configurations
npm run validate
# or
npm test
```

## Environment Variables

See [.env.example](./.env.example) for the complete list of environment variables.

### Key Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_BSM_KEY` | Yes* | OpenAI API key (highest priority) |
| `OPENAI_BSU_KEY` | Yes* | OpenAI API key (medium priority) |
| `OPENAI_API_KEY` | Yes* | OpenAI API key (lowest priority) |
| `ADMIN_TOKEN` | Yes | Admin authentication token (16+ chars in production) |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment: development/production |
| `LOG_LEVEL` | No | Logging level: debug/info/warn/error |

*At least ONE OpenAI key is required

## Troubleshooting

### "package.json not found"

Make sure you're running the script from the BSM project root directory:

```bash
cd /path/to/BSM
./scripts/bootstrap.sh
```

### "Node.js installation failed"

**Linux/macOS**: Install manually from [nodejs.org](https://nodejs.org/)

**Windows**:
- Ensure you're running PowerShell as Administrator
- Install winget from Microsoft Store (App Installer)
- Or install Node.js manually from [nodejs.org](https://nodejs.org/)

### "npm ci failed"

Try manual installation:

```bash
npm install
```

If still failing, delete `node_modules` and try again:

```bash
rm -rf node_modules package-lock.json
npm install
```

### "API keys not configured"

Edit your `.env` file and add at least one OpenAI API key:

```bash
OPENAI_BSM_KEY=sk-your-actual-key-here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)

### Permission Denied (Linux/macOS)

Make the script executable:

```bash
chmod +x scripts/bootstrap.sh
```

### Execution Policy Error (Windows)

If you get "execution policy" error, run PowerShell as Administrator and execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use

If port 3000 is already in use, set a different port in `.env`:

```bash
PORT=3001
```

## Security Notes

1. **Never commit `.env` to version control** - It contains secrets
2. **Change `ADMIN_TOKEN`** from the default "change-me" value
3. **Use strong tokens** in production (16+ characters, random)
4. **Keep API keys secure** - Don't share them publicly
5. **Review `.gitignore`** - Ensure `.env` is listed

## Additional Resources

- [Main README](./README.md) - Project overview and architecture
- [CLAUDE.md](./CLAUDE.md) - Development guidelines and conventions
- [API Documentation](./docs/) - API endpoints and usage
- [Agent Configuration](./data/agents/) - Agent YAML definitions

## Support

For issues or questions:

1. Check [existing issues](https://github.com/LexBANK/BSM/issues)
2. Review [documentation](./docs/)
3. Create a [new issue](https://github.com/LexBANK/BSM/issues/new)

## License

See [LICENSE](./LICENSE) file for details.
