# Deployment Guide (Ubuntu VPS)

**Target Environment:** Ubuntu 22.04 LTS / 24.04 LTS  
**Role:** VPS (Production/Staging)

---

## 0. Network Requirements

### Firewall Ports (TCP)

| Port | Service | Public? | Required |
|------|---------|---------|----------|
| **8082** | HTTP (Nginx) | ✅ Yes | Mandatory |
| **8443** | HTTPS (Nginx) | ✅ Yes | Mandatory |
| 5678 | n8n Admin | ❌ No* | Optional |
| 3005 | Frontend (host) | ❌ No | Internal |
| 5432 | PostgreSQL | ❌ No | Internal |
| 6379 | Redis | ❌ No | Internal |

> **\*Note:** n8n admin should be accessed via subdomain (e.g., `n8n.yourdomain.com`) through Nginx on port 8443, NOT directly on 5678. Port 5678 should only be exposed for initial setup or if you don't have a domain yet.

> **Port Configuration:** This deployment uses non-standard ports (8082/8443) to avoid conflicts with other services on the VPS. Nginx handles SSL termination and internally routes to standard ports (80/443) for containers.

### Configure UFW (Ubuntu Firewall)

```bash
# Enable firewall
sudo ufw enable

# Allow SSH (if not already)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (non-standard ports for multi-service VPS)
sudo ufw allow 8082/tcp
sudo ufw allow 8443/tcp

# Optional: Allow n8n direct access (development only)
# sudo ufw allow 5678/tcp

# Check status
sudo ufw status
```

### Expected Output
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
8082/tcp                   ALLOW       Anywhere
8443/tcp                   ALLOW       Anywhere
```

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
