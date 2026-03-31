# ClawBridge Dashboard Integration

**Package:** `clawbridge-dashboard`  
**Source:** https://github.com/dreamwing/clawbridge  
**License:** MIT  
**Stats:** 212 stars, 22 forks  
**Status:** Active (Official Project)

---

## Overview

ClawBridge is a mobile-first dashboard for OpenClaw that provides zero-config remote access via Cloudflare tunnels. This integration package provides configuration templates and setup automation for Heretek OpenClaw.

### Key Features

- **Mobile-first PWA design** - Optimized for mobile browsers with offline support
- **Zero-config remote access** - Cloudflare Tunnel integration for secure remote connectivity
- **Live activity feed** - WebSocket-based real-time event streaming
- **Token economy tracking** - Monitor token usage and costs across agents
- **Cost Control Center** - 10 automated cost diagnostics
- **Memory timeline view** - Visual timeline of episodic memories
- **Mission control** - Trigger cron jobs, restart services, manage agents

---

## Installation

### Quick Install (One-liner)

```bash
curl -sL https://clawbridge.app/install.sh | bash
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/dreamwing/clawbridge.git
cd clawbridge

# Install dependencies
npm install

# Copy configuration
cp .env.example .env
```

---

## Configuration

### Environment Variables

```bash
# ClawBridge Configuration
CLAWBRIDGE_PORT=3000
CLAWBRIDGE_HOST=0.0.0.0

# OpenClaw Gateway Connection
OPENCLAW_GATEWAY_URL=http://localhost:18789
OPENCLAW_ACCESS_KEY=your-access-key-here

# Cloudflare Tunnel (optional - for remote access)
CLOUDFLARE_TUNNEL_ENABLED=true
CLOUDFLARE_TUNNEL_DOMAIN=your-domain.trycloudflare.com

# Authentication
AUTH_TYPE=access-key
SESSION_TIMEOUT=3600
```

### Access Key Setup

1. Generate an access key:
```bash
openssl rand -hex 32
```

2. Add to `.env`:
```bash
CLAWBRIDGE_ACCESS_KEY=<generated-key>
```

3. Configure in OpenClaw Gateway (`openclaw.json`):
```json
{
  "dashboard": {
    "clawbridge": {
      "enabled": true,
      "accessKey": "<your-access-key>",
      "allowedOrigins": ["https://your-domain.trycloudflare.com"]
    }
  }
}
```

---

## Cloudflare Tunnel Setup

ClawBridge uses Cloudflare Tunnel for secure remote access without port forwarding.

### Automatic Setup

```bash
# Enable tunnel during installation
curl -sL https://clawbridge.app/install.sh | bash -s -- --tunnel
```

### Manual Setup

1. Install cloudflared:
```bash
# Linux
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# macOS
brew install cloudflared
```

2. Create tunnel:
```bash
cloudflared tunnel create clawbridge
```

3. Configure tunnel (`~/.cloudflared/config.yml`):
```yaml
tunnel: clawbridge
credentials-file: /root/.cloudflared/tunnel-credentials.json

ingress:
  - hostname: your-domain.trycloudflare.com
    service: http://localhost:3000
  - service: http_status:404
```

4. Run tunnel:
```bash
cloudflared tunnel run clawbridge
```

### Persistent Tunnel (systemd)

```bash
# Create service file
sudo nano /etc/systemd/system/cloudflared-clawbridge.service
```

```ini
[Unit]
Description=Cloudflare Tunnel for ClawBridge
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel run clawbridge
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl enable cloudflared-clawbridge
sudo systemctl start cloudflared-clawbridge
```

---

## Usage

### Start ClawBridge

```bash
# Development mode
npm run dev

# Production mode
npm start

# With Docker
docker-compose up -d
```

### Access Dashboard

- **Local:** http://localhost:3000
- **Remote:** https://your-domain.trycloudflare.com

### Mobile PWA

1. Open ClawBridge on mobile browser
2. Tap "Add to Home Screen"
3. Launch as standalone app

---

## Features

### Live Activity Feed

Real-time WebSocket streaming of:
- Agent messages
- Skill executions
- Token usage events
- System events

### Cost Control Center

10 automated diagnostics:
1. High token usage detection
2. Cost spike alerts
3. Model efficiency analysis
4. Idle agent detection
5. Redundant skill execution
6. Rate limit monitoring
7. Budget threshold alerts
8. Cost per agent breakdown
9. Cost per skill breakdown
10. Historical cost trends

### Memory Timeline

- Episodic memory visualization
- Semantic knowledge promotion tracking
- Dreamer consolidation events

### Mission Control

- Trigger cron jobs
- Restart agents
- Service health monitoring
- Emergency shutdown

---

## Security

### Access Key Authentication

ClawBridge uses access key authentication for API access:

```javascript
// API request example
fetch('http://localhost:3000/api/agents', {
  headers: {
    'Authorization': 'Bearer your-access-key'
  }
});
```

### Tunnel Security

- Cloudflare Tunnel encrypts all traffic
- No open ports on firewall
- Zero Trust network access
- DDoS protection via Cloudflare

### Best Practices

1. **Never commit `.env`** - Contains access keys
2. **Rotate keys regularly** - Generate new keys periodically
3. **Restrict origins** - Configure allowed CORS origins
4. **Enable audit logging** - Track all dashboard actions

---

## Integration with Heretek OpenClaw

### Gateway Configuration

Add to `openclaw.json`:

```json
{
  "dashboard": {
    "clawbridge": {
      "enabled": true,
      "port": 3000,
      "accessKey": "${CLAWBRIDGE_ACCESS_KEY}",
      "cloudflareTunnel": {
        "enabled": true,
        "domain": "${CLOUDFLARE_TUNNEL_DOMAIN}"
      }
    }
  }
}
```

### Agent Integration

Agents can emit events to ClawBridge:

```javascript
// Emit event to dashboard
gateway.emit('dashboard:event', {
  type: 'skill_execution',
  agent: 'explorer',
  skill: 'opportunity-scanner',
  status: 'completed',
  timestamp: Date.now()
});
```

---

## Troubleshooting

### Tunnel Not Connecting

```bash
# Check tunnel status
cloudflared tunnel list

# View tunnel logs
cloudflared tunnel info clawbridge
```

### Access Denied

1. Verify access key in `.env`
2. Check key matches Gateway configuration
3. Regenerate key if needed

### WebSocket Connection Failed

1. Check ClawBridge is running
2. Verify port 3000 is accessible
3. Check firewall settings

---

## References

- [ClawBridge Repository](https://github.com/dreamwing/clawbridge)
- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Heretek DEPLOYMENT.md](../../docs/DEPLOYMENT.md)
- [EXTERNAL_PROJECTS_GAP_ANALYSIS.md](../../docs/EXTERNAL_PROJECTS_GAP_ANALYSIS.md#clawbridge)

---

🦞 *Bridge to your collective, anywhere.*
