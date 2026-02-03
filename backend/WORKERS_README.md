# 🚀 Running Workers & Cron Jobs

## Prerequisites

- Redis server running
- MongoDB running
- Node.js 20+
- Environment variables configured

## Quick Start

### 1. Start Redis (if not running)
```bash
# macOS with Homebrew
brew services start redis

# Or using Docker
docker run -d -p 6379:6379 redis:alpine
```

### 2. Start API Server
```bash
npm run dev
```

### 3. Start Workers (in separate terminal)
```bash
npm run worker
```

### 4. Start Cron Jobs (in separate terminal)
```bash
npm run cron
```

## Worker Processes

### Domain Registration Worker
- **Queue:** `domain-registration`
- **Concurrency:** 3
- **Rate Limit:** 10/minute
- **Purpose:** Process domain registrations with GoDaddy

### Domain Renewal Worker
- **Queue:** `domain-renewal`
- **Concurrency:** 2
- **Rate Limit:** 5/minute
- **Purpose:** Renew expiring domains

### DNS Update Worker
- **Queue:** `dns-update`
- **Concurrency:** 5
- **Rate Limit:** 20/minute
- **Purpose:** Update DNS records

### Domain Transfer Worker
- **Queue:** `domain-transfer`
- **Concurrency:** 3
- **Rate Limit:** 10/minute
- **Purpose:** Check transfer status

### Email Notification Worker
- **Queue:** `email-notification`
- **Concurrency:** 10
- **Rate Limit:** 100/minute
- **Purpose:** Send all email notifications

## Cron Jobs

### Domain Expiry Check
- **Schedule:** Daily at 2:00 AM UTC
- **Purpose:** Send expiry warnings for domains expiring in 30/7/1 days

### Auto-Renewal
- **Schedule:** Daily at 3:00 AM UTC
- **Purpose:** Automatically renew domains with auto-renew enabled

### Transfer Status Check
- **Schedule:** Every hour
- **Purpose:** Check status of pending domain transfers

## Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# GoDaddy API
GODADDY_API_KEY=your_key
GODADDY_API_SECRET=your_secret
GODADDY_API_URL=https://api.ote-godaddy.com
GODADDY_ENV=development

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASSWORD=your_password
EMAIL_FROM=noreply@example.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

## Production Deployment

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start all processes
pm2 start ecosystem.config.js

# Or start individually
pm2 start src/server.js --name api
pm2 start src/workers/index.js --name workers
pm2 start src/cron/index.js --name cron

# Monitor
pm2 monit

# Save configuration
pm2 save
pm2 startup
```

### Create `ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'src/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
    {
      name: 'workers',
      script: 'src/workers/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'cron',
      script: 'src/cron/index.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

### Using Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    command: npm start
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - MONGO_URI=mongodb://mongo:27017/saasify
    depends_on:
      - redis
      - mongo

  workers:
    build: .
    command: npm run worker
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - MONGO_URI=mongodb://mongo:27017/saasify
    depends_on:
      - redis
      - mongo

  cron:
    build: .
    command: npm run cron
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - MONGO_URI=mongodb://mongo:27017/saasify
    depends_on:
      - redis
      - mongo

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

## Monitoring

### BullMQ Dashboard

```bash
# Install bull-board
npm install @bull-board/express

# Add to your app.js
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(domainRegistrationQueue),
    new BullMQAdapter(domainRenewalQueue),
    new BullMQAdapter(dnsUpdateQueue),
    new BullMQAdapter(domainTransferQueue),
    new BullMQAdapter(emailQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());
```

Visit: `http://localhost:3000/admin/queues`

### Redis Monitoring

```bash
# Connect to Redis CLI
redis-cli

# Monitor keys
KEYS bull:domain-registration:*

# Check queue length
LLEN bull:domain-registration:waiting
LLEN bull:domain-registration:active
LLEN bull:domain-registration:failed

# Monitor in real-time
MONITOR
```

## Troubleshooting

### Workers not processing jobs
```bash
# Check if workers are running
ps aux | grep node

# Check Redis connection
redis-cli ping

# View worker logs
pm2 logs workers --lines 50
```

### Cron jobs not running
```bash
# Check cron process
pm2 logs cron --lines 50

# Verify timezone
date
```

### Failed jobs
```bash
# Check failed jobs in Redis
redis-cli
> SMEMBERS bull:domain-registration:failed

# Or use Bull Dashboard to view failures
```

## Scaling

### Horizontal Scaling (Multiple Workers)

```bash
# Start multiple worker instances
pm2 start src/workers/index.js -i 3 --name workers

# Or in Docker Compose
services:
  workers:
    deploy:
      replicas: 3
```

### Vertical Scaling (Increase Concurrency)

Edit concurrency in each worker file:

```javascript
// Increase concurrency
{
  connection: redisConfig,
  concurrency: 10, // Was 3
}
```

## Health Checks

Add health check endpoint:

```javascript
// In app.js
app.get('/health/queues', async (req, res) => {
  const queues = [
    domainRegistrationQueue,
    domainRenewalQueue,
    // ... other queues
  ];

  const health = await Promise.all(
    queues.map(async (queue) => ({
      name: queue.name,
      waiting: await queue.getWaitingCount(),
      active: await queue.getActiveCount(),
      failed: await queue.getFailedCount(),
    }))
  );

  res.json({ status: 'ok', queues: health });
});
```

## Testing Workers

```javascript
// Manually add job for testing
import { domainRegistrationQueue } from './src/queues/domain.queue.js';

await domainRegistrationQueue.add('test-registration', {
  orderId: 'test-order-id',
  domainId: 'test-domain-id',
  userId: 'test-user-id',
  domainData: {
    domain: 'test.com',
    period: 1,
    // ... other data
  },
});
```

## Support

For issues or questions:
- Check logs: `pm2 logs`
- Monitor queues: `/admin/queues`
- Check Redis: `redis-cli`
