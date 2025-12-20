# Deployment Guide

This guide covers deploying the QMR Backend to a production server.

## Prerequisites

- Node.js v18+ installed on server
- PostgreSQL database accessible from server
- Environment variables configured
- Git repository access (or files uploaded)

## Deployment Steps

### 1. Prepare Environment Variables

Create a `.env` file on the server with production values:

```env
# Server Configuration
PORT=4000
NODE_ENV=production

# Database Configuration
DATABASE_URL="postgresql://username:password@host:5432/qmr_database"

# JWT Configuration
JWT_SECRET="your-production-secret-key-change-this"
JWT_EXPIRES_IN="10d"

# CORS Configuration
CORS_ORIGIN="https://your-frontend-domain.com"

# Security
BCRYPT_ROUNDS=10

# Database Connection Pool (Optional)
DB_CONNECTION_LIMIT=5
DB_POOL_TIMEOUT=20
```

### 2. Install Dependencies

```bash
npm install --production
```

**Note:** The `postinstall` script will automatically run `prisma generate` after `npm install`.

### 3. Run Database Migrations

**IMPORTANT:** Always run migrations before starting the application in production.

```bash
# Deploy all pending migrations
npm run db:migrate:deploy
```

This command:
- Applies all pending migrations to the database
- Does NOT create new migrations (use `db:migrate` in development only)
- Is safe to run multiple times (idempotent)
- Does NOT reset the database

### 4. Verify Migration Status

Check if all migrations are applied:

```bash
npm run db:migrate:status
```

Expected output:
```
Database schema is up to date! All migrations have been applied.
```

### 5. Start the Application

```bash
# Using npm
npm start

# Or using PM2 (recommended for production)
pm2 start src/index.js --name qmr-backend

# Or using systemd (Linux)
sudo systemctl start qmr-backend
```

## Production Deployment Checklist

- [ ] Environment variables configured (`.env` file)
- [ ] Dependencies installed (`npm install --production`)
- [ ] Prisma client generated (`prisma generate` - runs automatically via postinstall)
- [ ] Database migrations deployed (`npm run db:migrate:deploy`)
- [ ] Migration status verified (`npm run db:migrate:status`)
- [ ] Application started
- [ ] Health check endpoint tested
- [ ] Database connection verified

## Prisma Commands Reference

### Development (Local)
```bash
# Create and apply migration
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Push schema changes (dev only - not for production)
npm run db:push
```

### Production (Server)
```bash
# Deploy migrations (use this in production)
npm run db:migrate:deploy

# Check migration status
npm run db:migrate:status

# Generate Prisma client (runs automatically on npm install)
npm run db:generate
```

## Important Notes

### ⚠️ Never Use in Production:
- `prisma migrate dev` - Creates new migrations (development only)
- `prisma db push` - Direct schema push (development only)
- `prisma migrate reset` - Resets database (development only)

### ✅ Always Use in Production:
- `prisma migrate deploy` - Applies existing migrations
- `prisma generate` - Generates Prisma client (auto-runs on install)

## Troubleshooting

### Migration Fails

If migrations fail:

1. Check database connection:
```bash
# Test connection
psql $DATABASE_URL
```

2. Check migration status:
```bash
npm run db:migrate:status
```

3. Review migration files in `prisma/migrations/`

4. Check Prisma logs for detailed errors

### Prisma Client Not Generated

If you see "Prisma Client not generated" errors:

```bash
npm run db:generate
```

### Database Connection Issues

1. Verify `DATABASE_URL` is correct
2. Check database server is accessible
3. Verify firewall rules allow connections
4. Check database credentials

## Automated Deployment Script

Example deployment script (`deploy.sh`):

```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest code (if using git)
# git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Run migrations
echo "🗄️  Running database migrations..."
npm run db:migrate:deploy

# Verify migrations
echo "✅ Verifying migrations..."
npm run db:migrate:status

# Restart application (adjust based on your process manager)
echo "🔄 Restarting application..."
pm2 restart qmr-backend

echo "✅ Deployment complete!"
```

Make it executable:
```bash
chmod +x deploy.sh
```

## PM2 Setup (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Start application:
```bash
pm2 start src/index.js --name qmr-backend
```

Save PM2 configuration:
```bash
pm2 save
pm2 startup
```

## Environment-Specific Configuration

### Development
- Uses `prisma migrate dev` (creates migrations)
- Auto-generates Prisma client
- Hot reload enabled

### Production
- Uses `prisma migrate deploy` (applies migrations)
- Prisma client generated on install
- Process manager (PM2/systemd) for reliability

## Security Checklist

- [ ] Strong `JWT_SECRET` set
- [ ] Database credentials secure
- [ ] CORS origin configured correctly
- [ ] Environment variables not committed to git
- [ ] Database backups configured
- [ ] SSL/TLS enabled for database connection
- [ ] Firewall rules configured

## Monitoring

After deployment, monitor:

1. Application logs
2. Database connection pool
3. Error rates
4. Response times
5. Migration status

## Rollback Procedure

If you need to rollback:

1. **Rollback Application Code:**
   ```bash
   git checkout <previous-commit>
   npm install --production
   pm2 restart qmr-backend
   ```

2. **Rollback Database Migration:**
   - Prisma doesn't support automatic rollback
   - Manually revert migration SQL if needed
   - Or restore from database backup

## Support

For issues:
1. Check application logs
2. Check Prisma migration status
3. Verify environment variables
4. Test database connection

