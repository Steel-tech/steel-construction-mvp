# 🔒 SSL Certificate Setup Guide

## Option 1: Let's Encrypt (Free SSL - Recommended)

### Using Certbot with Nginx

```bash
# Install Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Set up auto-renewal cron job (runs twice daily)
echo "0 */12 * * * root certbot renew --quiet" | sudo tee -a /etc/crontab > /dev/null
```

### Using Certbot with Docker

```bash
# Create certificate volume
docker volume create certificates

# Run Certbot container
docker run -it --rm \
  -v certificates:/etc/letsencrypt \
  -v ./certbot:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com

# Auto-renewal with Docker
# Add to crontab:
0 0 * * * docker run --rm -v certificates:/etc/letsencrypt certbot/certbot renew --quiet
```

## Option 2: Self-Signed Certificate (Development Only)

```bash
# Create SSL directory
mkdir -p nginx/ssl
cd nginx/ssl

# Generate private key
openssl genrsa -out key.pem 2048

# Generate certificate signing request
openssl req -new -key key.pem -out csr.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out cert.pem

# Clean up CSR
rm csr.pem
```

## Option 3: Commercial SSL Certificate

### Purchase from providers like:
- DigiCert
- Comodo/Sectigo
- GoDaddy
- Namecheap

### Installation steps:
```bash
# 1. Generate CSR (Certificate Signing Request)
openssl req -new -newkey rsa:2048 -nodes \
  -keyout yourdomain.key \
  -out yourdomain.csr

# 2. Submit CSR to certificate provider
# 3. Download certificate files
# 4. Combine certificates (if needed)
cat yourdomain.crt intermediate.crt root.crt > fullchain.pem

# 5. Place in nginx/ssl directory
cp fullchain.pem nginx/ssl/cert.pem
cp yourdomain.key nginx/ssl/key.pem
```

## Option 4: Cloudflare SSL (Proxy)

1. Add your domain to Cloudflare
2. Update DNS nameservers to Cloudflare
3. Enable "Full (strict)" SSL mode
4. Generate Origin Certificate:
   - Go to SSL/TLS → Origin Server
   - Create Certificate
   - Download and save as `cert.pem` and `key.pem`

## Docker Compose SSL Configuration

Update your `docker-compose.yml`:

```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./frontend/dist:/usr/share/nginx/html:ro
    - ./nginx/ssl:/etc/nginx/ssl:ro  # SSL certificates
    - ./certbot:/var/www/certbot:ro  # For Let's Encrypt challenges
```

## Environment Variable Updates

Update `.env` for production:

```env
# Frontend
VITE_API_URL=https://api.yourdomain.com/api/v1

# Backend
FRONTEND_URL=https://yourdomain.com
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

## Testing SSL Configuration

```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Check SSL grade
curl https://api.ssllabs.com/api/v3/analyze?host=yourdomain.com

# Test HTTPS redirect
curl -I http://yourdomain.com

# Verify certificate details
openssl x509 -in nginx/ssl/cert.pem -text -noout
```

## Security Headers Check

After SSL setup, verify security headers:

```bash
curl -I https://yourdomain.com

# Should see:
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
# X-XSS-Protection: 1; mode=block
```

## Troubleshooting

### Certificate not trusted
- Ensure intermediate certificates are included
- Check certificate chain order
- Verify domain matches certificate

### Mixed content warnings
- Update all HTTP references to HTTPS
- Check API calls use HTTPS
- Update asset URLs

### Certificate renewal failed
```bash
# Check Certbot logs
sudo cat /var/log/letsencrypt/letsencrypt.log

# Manually renew
sudo certbot renew --force-renewal
```

## Production Checklist

- [ ] SSL certificate installed and valid
- [ ] HTTP redirects to HTTPS
- [ ] HSTS header enabled
- [ ] Certificate auto-renewal configured
- [ ] Security headers properly set
- [ ] No mixed content warnings
- [ ] SSL Labs grade A or better
- [ ] Certificate expiry monitoring set up