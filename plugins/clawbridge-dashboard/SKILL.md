---
name: clawbridge-dashboard
description: ClawBridge mobile-first dashboard with Cloudflare tunnel remote access
---

# ClawBridge Dashboard Integration

**Purpose:** Provides mobile-first dashboard access to Heretek OpenClaw with zero-config remote access via Cloudflare Tunnel.

**Source:** https://github.com/dreamwing/clawbridge

**License:** MIT

---

## Installation

### Quick Install

```bash
curl -sL https://clawbridge.app/install.sh | bash
```

### Manual Install

```bash
git clone https://github.com/dreamwing/clawbridge.git /opt/clawbridge
cd /opt/clawbridge
npm install
cp .env.example .env
```

---

## Configuration

### Environment File (.env)

```bash
# Server Configuration
CLAWBRIDGE_PORT=3000
CLAWBRIDGE_HOST=0.0.0.0

# OpenClaw Gateway Connection
OPENCLAW_GATEWAY_URL=http://localhost:18789

# Access Key Authentication (generate with: openssl rand -hex 32)
CLAWBRIDGE_ACCESS_KEY=your-access-key-here

# Cloudflare Tunnel
CLOUDFLARE_TUNNEL_ENABLED=true
CLOUDFLARE_TUNNEL_DOMAIN=

# Session Configuration
SESSION_TIMEOUT=3600
```

### Gateway Configuration (openclaw.json)

Add to `openclaw.json`:

```json
{
  "dashboard": {
    "clawbridge": {
      "enabled": true,
      "port": 3000,
      "accessKey": "${CLAWBRIDGE_ACCESS_KEY}",
      "allowedOrigins": ["*"],
      "cloudflareTunnel": {
        "enabled": true
      }
    }
  }
}
```

---

## Cloudflare Tunnel Setup

### One-Command Setup

```bash
# Install and configure tunnel
curl -sL https://clawbridge.app/install.sh | bash -s -- --tunnel
```

### Manual Tunnel Configuration

1. **Install cloudflared:**
```bash
# Linux (deb)
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Linux (rpm)
curl -L --output cloudflared.rpm https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.rpm
sudo rpm -i cloudflared.rpm

# macOS
brew install cloudflared
```

2. **Create Tunnel:**
```bash
cloudflared tunnel create clawbridge-openclaw
```

3. **Configure Tunnel** (`~/.cloudflared/config.yml`):
```yaml
tunnel: clawbridge-openclaw
credentials-file: /root/.cloudflared/tunnel-credentials.json

ingress:
  - hostname: openclaw-dashboard.trycloudflare.com
    service: http://localhost:3000
  - service: http_status:404
```

4. **Run Tunnel:**
```bash
cloudflared tunnel run clawbridge-openclaw
```

5. **Persistent Service** (systemd):
```bash
sudo nano /etc/systemd/system/cloudflared-clawbridge.service
```

```ini
[Unit]
Description=Cloudflare Tunnel for ClawBridge Dashboard
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel run clawbridge-openclaw
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-clawbridge
sudo systemctl start cloudflared-clawbridge
sudo systemctl status cloudflared-clawbridge
```

---

## Access Key Authentication

### Generate Access Key

```bash
openssl rand -hex 32
```

### Configure Access Key

1. Add to ClawBridge `.env`:
```bash
CLAWBRIDGE_ACCESS_KEY=<generated-key>
```

2. Add to OpenClaw Gateway `openclaw.json`:
```json
{
  "dashboard": {
    "clawbridge": {
      "accessKey": "<same-key>"
    }
  }
}
```

### API Authentication

```bash
# Example API call with access key
curl -H "Authorization: Bearer your-access-key" \
  http://localhost:3000/api/agents

# WebSocket connection
wscat -c ws://localhost:3000/ws -H "Authorization: Bearer your-access-key"
```

---

## Usage

### Start Dashboard

```bash
cd /opt/clawbridge
npm start
```

### Access Dashboard

- **Local:** http://localhost:3000
- **Remote:** https://openclaw-dashboard.trycloudflare.com

### Mobile PWA

1. Open URL on mobile browser (Safari/Chrome)
2. Tap "Share" → "Add to Home Screen"
3. Launch from home screen as native app

---

## Features

| Feature | Description |
|---------|-------------|
| **Live Activity Feed** | Real-time WebSocket streaming of agent events |
| **Token Economy** | Track token usage and costs per agent/model |
| **Cost Control Center** | 10 automated cost diagnostics |
| **Memory Timeline** | Visual timeline of episodic memories |
| **Mission Control** | Trigger cron jobs, restart services |
| **System Health** | CPU, RAM, disk, temperature monitoring |
| **Agent Management** | Start/stop/restart agents |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tunnel not connecting | Run `cloudflared tunnel list` to verify |
| Access denied | Verify access key matches in both configs |
| WebSocket failed | Check port 3000 is accessible |
| PWA not installing | Clear browser cache, retry |

---

## Security Notes

- ✅ MIT licensed - open source, auditable
- ✅ Cloudflare Tunnel - no open firewall ports
- ✅ Access key auth - token-based authentication
- ✅ Encrypted traffic - TLS via Cloudflare
- ⚠️ Never commit `.env` - contains access keys
- ⚠️ Rotate keys periodically - security best practice

---

## References

- [`EXTERNAL_PROJECTS_GAP_ANALYSIS.md`](docs/EXTERNAL_PROJECTS_GAP_ANALYSIS.md#clawbridge)
- [`DEPLOYMENT.md`](docs/DEPLOYMENT.md#external-integrations)
- [ClawBridge Repository](https://github.com/dreamwing/clawbridge)
- [Cloudflare Tunnel Docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
