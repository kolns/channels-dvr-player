# 🚀 Production Deployment Guide

This guide covers deploying Channels DVR Player in a production environment.

## 📋 Pre-Deployment Checklist

- [ ] **Environment configured** - `.env` file created with secure settings
- [ ] **Secret key generated** - Use a cryptographically secure random key
- [ ] **Debug mode disabled** - `FLASK_DEBUG=False` in production
- [ ] **Dependencies updated** - All packages up to date
- [ ] **Security review completed** - No hardcoded secrets or debug code

## 🔧 Production Setup

### 1. Environment Configuration

Copy the example environment file and configure for production:

```bash
cp .env.example .env
```

Edit `.env` and set secure values:

```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Update .env file with:
SECRET_KEY=your-generated-secure-key-here
FLASK_DEBUG=False
HOST=0.0.0.0
PORT=7734
```

### 2. Production Server Options

#### Option A: Built-in Flask Server (Development/Small Scale)
```bash
python start.py
```

#### Option B: Gunicorn (Recommended for Production)
```bash
# Install gunicorn (already in requirements.txt)
pip install gunicorn

# Start with Gunicorn
gunicorn --bind 0.0.0.0:7734 --workers 4 app:app
```

#### Option C: Docker Deployment
For easiest deployment, use the provided `docker-compose.yml` file:

```bash
# Build and start the container in the background
docker compose up -d
```

This will:
- Build the custom image defined in the `Dockerfile`
- Map port 7734 from the container to your host machine
- Create a volume map for `./config` so your setup and database are persisted
- Uses host networking by default to support Channels DVR auto-discovery

To stop the application:
```bash
docker compose down
```

To view logs:
```bash
docker compose logs -f
```

### 3. Reverse Proxy Setup (Optional)

For production deployments, consider using Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:7734;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔒 Security Considerations

### Required for Production:
1. **Generate secure SECRET_KEY** - Never use the default development key
2. **Disable debug mode** - Set `FLASK_DEBUG=False`
3. **Use HTTPS** - Configure SSL/TLS certificates
4. **Network security** - Ensure only necessary ports are open
5. **Regular updates** - Keep dependencies updated

### Network Security:
- The application discovers Channels DVR via mDNS/Bonjour
- Ensure both devices are on the same trusted network
- Consider firewall rules for port 7734

## 📊 Monitoring & Logging

The application logs to both file (`player.log`) and console. Monitor logs for:
- Application startup/shutdown
- DVR discovery issues
- Channel sync errors
- User access patterns

## 🔄 Updates & Maintenance

### Updating the Application:
1. Backup your database: `cp config/channels.db config/channels.db.backup`
2. Update application files
3. Restart the service
4. Verify functionality

### Database Backup:
```bash
# Backup
cp config/channels.db config/channels.db.$(date +%Y%m%d)

# Restore if needed
cp config/channels.db.backup config/channels.db
```

## 🌐 Network Requirements

- **mDNS/Bonjour**: Required for automatic DVR discovery
- **Port 7734**: Application web interface
- **Network connectivity**: Both devices must be on same network subnet

## 🐛 Troubleshooting Production Issues

### Common Issues:
1. **DVR not discovered**: Check network connectivity and mDNS
2. **Permission errors**: Ensure app has write access to `config/` directory
3. **Port conflicts**: Change PORT in `.env` if 7734 is in use
4. **Performance issues**: Consider increasing Gunicorn workers

### Debug Mode (Temporary):
```bash
# Enable debug temporarily for troubleshooting
export FLASK_DEBUG=True
python start.py
```

**Remember to disable debug mode for production!**
