# Deployment Guide (Without Docker)

This guide covers deploying the RBAC microservice without Docker, using your existing PostgreSQL database.

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL database (already configured)
- Access to the server where the service will be deployed

## Step-by-Step Deployment

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

The `.env` file has been configured with your database connection. Review and update the following:

#### Required Changes for Production:

1. **JWT Secrets**: Generate strong, random secrets

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate JWT_REFRESH_SECRET
openssl rand -base64 32
```

Update these values in `.env`:

```env
JWT_SECRET=<generated-secret-1>
JWT_REFRESH_SECRET=<generated-secret-2>
```

2. **Node Environment**: Ensure production mode

```env
NODE_ENV=production
```

3. **GraphQL Playground**: Disable in production

```env
GRAPHQL_PLAYGROUND=false
GRAPHQL_DEBUG=false
```

4. **CORS Origins**: Update with your actual domains

```env
CORS_ORIGIN=https://your-frontend-domain.com,https://your-api-domain.com
```

### 3. Database Setup

#### Generate Prisma Client

```bash
pnpm prisma:generate
```

#### Run Database Migrations

```bash
pnpm prisma migrate deploy
```

Note: Use `migrate deploy` for production instead of `migrate dev`

#### Seed the Database (First Time Only)

```bash
pnpm prisma:seed
```

This will create:

- Default admin user (credentials will be displayed in console)
- Basic roles (admin, manager, user)
- Common permissions
- Sample policy

**Important**: Save the admin credentials shown in the console output!

### 4. Build the Application

```bash
pnpm build
```

This creates an optimized production build in the `dist/` directory.

### 5. Start the Service

#### Option A: Direct Start

```bash
pnpm start:prod
```

#### Option B: Using PM2 (Recommended for Production)

Install PM2 globally:

```bash
npm install -g pm2
```

Create PM2 ecosystem file:

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'rbac-service',
    script: 'dist/main.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
};
EOF
```

Start with PM2:

```bash
# Create logs directory
mkdir -p logs

# Start the service
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

PM2 useful commands:

```bash
pm2 list                  # List all processes
pm2 logs rbac-service     # View logs
pm2 restart rbac-service  # Restart service
pm2 stop rbac-service     # Stop service
pm2 delete rbac-service   # Delete from PM2
pm2 monit                 # Monitor resources
```

### 6. Verify Deployment

#### Health Check

```bash
# Check if service is running
curl http://localhost:3000/auth/me
```

Expected response: `401 Unauthorized` (means service is running)

#### Test Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usernameOrEmail": "admin@example.com",
    "password": "Admin@123"
  }'
```

Replace with your actual admin credentials from the seed output.

#### GraphQL Endpoint

Visit: http://localhost:3000/graphql (if GRAPHQL_PLAYGROUND=true)

#### REST API Documentation

Visit: http://localhost:3000/api/docs

### 7. Configure Reverse Proxy (Optional but Recommended)

#### Using Nginx

Install Nginx:

```bash
# macOS
brew install nginx

# Ubuntu/Debian
sudo apt-get install nginx
```

Create Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

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
}
```

Test and reload Nginx:

```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo nginx -s reload
```

### 8. SSL/TLS Setup (Recommended for Production)

Using Let's Encrypt (free SSL):

```bash
# macOS
brew install certbot

# Ubuntu/Debian
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com
```

### 9. Firewall Configuration

```bash
# macOS (using pf)
# Allow port 3000 only from localhost if using Nginx
sudo pfctl -e

# Ubuntu/Debian (using ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp  # Only if direct access needed
sudo ufw enable
```

## Production Checklist

- [ ] Install dependencies (`pnpm install`)
- [ ] Configure `.env` with production settings
- [ ] Generate strong JWT secrets
- [ ] Update CORS origins
- [ ] Disable GraphQL playground
- [ ] Run Prisma generate (`pnpm prisma:generate`)
- [ ] Run database migrations (`pnpm prisma migrate deploy`)
- [ ] Seed database (first time: `pnpm prisma:seed`)
- [ ] Save admin credentials
- [ ] Build application (`pnpm build`)
- [ ] Install and configure PM2
- [ ] Start service with PM2
- [ ] Configure PM2 startup
- [ ] Test service endpoints
- [ ] Configure Nginx reverse proxy (optional)
- [ ] Setup SSL/TLS certificate
- [ ] Configure firewall
- [ ] Setup monitoring and logging
- [ ] Configure database backups

## Maintenance Commands

### Update Service

```bash
# Pull latest code
git pull

# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma migrate deploy

# Rebuild
pnpm build

# Restart with PM2
pm2 restart rbac-service
```

### Database Management

```bash
# Create new migration
pnpm prisma migrate dev --name migration_name

# Deploy migrations
pnpm prisma migrate deploy

# Open Prisma Studio (database GUI)
pnpm prisma:studio
```

### View Logs

```bash
# PM2 logs
pm2 logs rbac-service

# Or from log files
tail -f logs/out.log
tail -f logs/err.log
```

### Backup Database

```bash
# Create backup
pg_dump -U atiqisrak -h localhost rbac_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -U atiqisrak -h localhost rbac_db < backup_20241021_120000.sql
```

## Monitoring

### Setup Monitoring (Optional)

1. **Health Check Endpoint**

   - Monitor: `GET http://localhost:3000/auth/me`
   - Expected: 401 (service running)

2. **PM2 Monitoring**

   ```bash
   pm2 monit
   ```

3. **External Monitoring Services**
   - UptimeRobot: https://uptimerobot.com
   - Pingdom: https://www.pingdom.com
   - New Relic: https://newrelic.com

## Troubleshooting

### Service Won't Start

1. Check if port is available:

```bash
lsof -i :3000
```

2. Check environment variables:

```bash
cat .env
```

3. Verify database connection:

```bash
pnpm prisma db pull
```

### Database Connection Issues

1. Test PostgreSQL connection:

```bash
psql "postgresql://atiqisrak:Niloy@Niil9@localhost:5432/rbac_db"
```

2. Check if database exists:

```bash
psql -U atiqisrak -h localhost -l
```

3. Verify DATABASE_URL in `.env`

### Migration Issues

Reset migrations (development only):

```bash
pnpm prisma migrate reset
```

Deploy specific migration:

```bash
pnpm prisma migrate resolve --applied migration_name
```

## Performance Optimization

1. **Enable Connection Pooling**
   Update DATABASE_URL in `.env`:

   ```env
   DATABASE_URL="postgresql://atiqisrak:Niloy@Niil9@localhost:5432/rbac_db?schema=public&connection_limit=10&pool_timeout=20"
   ```

2. **Increase PM2 Instances**
   Update `ecosystem.config.js`:

   ```javascript
   instances: 4; // or 'max' to use all CPU cores
   ```

3. **Enable Redis Caching** (if needed)
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```

## Security Best Practices

1. **Change default admin password** immediately after first login
2. **Use strong JWT secrets** (generated with openssl)
3. **Enable HTTPS** in production
4. **Restrict CORS origins** to your actual domains
5. **Keep dependencies updated**: `pnpm update`
6. **Regular database backups**
7. **Monitor logs** for suspicious activity
8. **Use environment variables** for all secrets
9. **Disable GraphQL playground** in production
10. **Implement rate limiting** (future enhancement)

## Support

For issues during deployment:

1. Check logs: `pm2 logs rbac-service`
2. Review `.env` configuration
3. Test database connectivity
4. Verify all dependencies are installed
5. Check firewall and port availability

## Next Steps

After successful deployment:

1. Test all API endpoints
2. Create necessary roles and permissions for your application
3. Integrate with your frontend/other services
4. Setup monitoring and alerting
5. Configure automated backups
6. Document your custom permissions and roles
