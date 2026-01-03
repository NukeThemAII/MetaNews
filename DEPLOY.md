# Deployment Guide (Ubuntu VPS)

**Target Environment:** Ubuntu 22.04 LTS / 24.04 LTS  
**Role:** VPS (Production/Staging)

---

## 1. Prerequisites

Ensure the following are installed on your VPS:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# (Log out and back in for group changes to take effect)

# Install Git
sudo apt install -y git
```

---

## 2. Installation

```bash
# 1. Clone the repository
git clone https://github.com/NukeThemAII/MetaNews.git
cd MetaNews

# 2. Configure Environment
cp .env.example .env

# 3. EDIT .env (CRITICAL)
# Add your real API keys and secrets!
nano .env
# - GEMINI_API_KEY
# - OPENAI_API_KEY
# - TELEGRAM_BOT_TOKEN
# - N8N_BASIC_AUTH_PASSWORD
# - STRIPE_SECRET_KEY
```

---

## 3. Launch Services

```bash
# Start the full stack (detached mode)
docker compose up -d

# Verify containers are running
docker compose ps
# Expected: metanews-n8n, metanews-postgres, metanews-redis, metanews-frontend, metanews-nginx, metanews-backup
```

---

## 4. Post-Launch Setup

### A. n8n Workflows
1.  Open `https://n8n.your-domain.com` (or `http://<IP>:5678` if no domain yet).
2.  Login with credentials set in `.env`.
3.  Go to **Workflows** -> **Import from File**.
4.  Select all files in `n8n-workflows/`.
5.  **Activate** the workflows.

### B. Database Migration (If needed)
The `schema.sql` runs automatically on the *first* container start.
To force a reset (WARNING: DELETES DATA):

```bash
docker compose down -v
docker compose up -d
```

---

## 5. Updates

To pull the latest changes from GitHub:

```bash
# 1. Pull code
git pull origin main

# 2. Rebuild frontend (if needed) and restart
docker compose up -d --build
```

---

## 6. Troubleshooting

```bash
# View logs
docker compose logs -f

# Check specific service
docker compose logs -f n8n

# Check health
curl -I http://localhost:3000
```
