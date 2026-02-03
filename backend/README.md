# Hosting Platform Backend

Production-grade backend for Domain + Hosting Platform (WHMCS Clone)

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.0.0
- MongoDB >= 7.0
- Redis >= 7.0

### Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.development .env

# Update environment variables in .env file

# Start development server
npm run dev
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Database, Redis configuration
│   ├── models/          # Mongoose models
│   ├── modules/         # Feature modules (auth, domains, etc.)
│   ├── middleware/      # Express middleware
│   ├── queues/          # BullMQ queue definitions
│   ├── workers/         # Job workers
│   ├── cron/            # Cron jobs
│   ├── lib/             # External providers (GoDaddy, cPanel)
│   ├── utils/           # Helper functions
│   ├── validators/      # Input validation schemas
│   ├── constants/       # Enums and constants
│   ├── tests/           # Test files
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── logs/                # Application logs
├── .env.development     # Development environment
├── package.json
└── README.md
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run worker` - Start background workers
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Lint code
- `npm run create-indexes` - Create database indexes

## 🔧 Environment Variables

See `.env.development` for all available environment variables.

Key variables:
- `NODE_ENV` - Environment (development/staging/production)
- `PORT` - Server port (default: 4000)
- `MONGO_URI` - MongoDB connection string
- `REDIS_HOST` - Redis host
- `JWT_SECRET` - JWT signing secret
- `GODADDY_API_KEY` - GoDaddy API key
- `RAZORPAY_KEY_ID` - Razorpay key

## 🗄️ Database

### MongoDB Models
- User - User authentication
- Client - Client profiles
- Domain - Domain management
- Product - Products/services
- Order - Customer orders
- Service - Active services
- Invoice - Billing invoices
- Transaction - Payment transactions
- Server - Hosting servers

### Create Indexes
```bash
npm run create-indexes
```

## 🚀 Deployment

### Using Docker
```bash
docker build -t hosting-platform-backend .
docker run -p 4000:4000 --env-file .env.production hosting-platform-backend
```

### Using PM2
```bash
pm2 start src/server.js --name api
pm2 start src/workers/index.js --name worker
```

## 📚 API Documentation

API runs on `http://localhost:4000/api`

### Endpoints
- `/api/auth` - Authentication
- `/api/domains` - Domain management
- `/api/products` - Products
- `/api/services` - Services
- `/api/orders` - Orders
- `/api/invoices` - Invoices
- `/api/payments` - Payments
- `/api/admin` - Admin operations

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run with coverage
npm run test:coverage
```

## 📝 License

MIT
