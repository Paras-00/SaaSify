# SaaSify - Complete MERN Hosting Platform

🎉 **ALL PHASES COMPLETE** 🎉

A production-ready hosting and domain management platform built with the MERN stack - similar to WHMCS.

## 📋 Project Status

- ✅ **Phase 1**: Authentication & Core Setup
- ✅ **Phase 2**: Domain Management
- ✅ **Phase 3**: Payments & Billing  
- ✅ **Phase 4**: Frontend UI

## 🛠️ Technology Stack

**Backend**: Node.js, Express, MongoDB, Redis, BullMQ, JWT, Razorpay, Stripe, GoDaddy API
**Frontend**: React 19, Vite 7, React Router 7, Tailwind CSS 4, Zustand, Axios

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- MongoDB
- Redis

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure environment variables
npm run dev           # Starts on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env  # Configure API URL
npm run dev           # Starts on http://localhost:5173
```

## ✨ Key Features

### Authentication & Security
- JWT authentication with refresh tokens
- Role-based access control (Admin/Client)
- Two-factor authentication (2FA)
- Email verification
- Password reset functionality
- Rate limiting & brute force protection

### Domain Management
- Domain search across multiple TLDs
- Real-time availability checking
- Domain registration via GoDaddy API
- Domain transfer management
- DNS record management (A, AAAA, CNAME, MX, TXT, SRV)
- Domain contacts management
- Domain lock/unlock
- Auto-renewal system
- Expiry tracking & notifications

### Billing & Payments
- Automated invoice generation
- Multiple payment gateways:
  - Razorpay (Indian market)
  - Stripe (International)
  - Wallet payments
- Invoice PDF generation
- Email invoice delivery
- Payment reminders
- Late fee calculation
- Service suspension workflow

### Wallet System
- Customer wallet balances
- Add funds functionality
- Pay invoices from wallet
- Transaction history
- Admin balance adjustments

### Automation & Background Jobs
- Domain expiry monitoring (daily)
- Auto-renewal processing (daily)
- Transfer status updates (hourly)
- Payment reminders (3 days before due)
- Service suspension (7 days overdue)
- Service termination (30 days suspended)
- Email notifications

### Frontend Features
- Responsive React application
- User dashboard with overview stats
- Domain management interface
- Invoice listing & payment
- Wallet management
- User profile & settings
- Mobile-responsive design

## 📁 Project Structure

```
SaaSify/
├── backend/              # Express.js API server
│   ├── src/
│   │   ├── config/       # Database, Redis, indexes
│   │   ├── cron/         # Scheduled jobs (6 cron jobs)
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── models/       # Mongoose schemas (10 models)
│   │   ├── modules/      # Feature modules (8 modules)
│   │   ├── queues/       # BullMQ queues
│   │   ├── services/     # Business logic
│   │   ├── workers/      # Background workers (5 workers)
│   │   └── utils/        # Helpers, logger, encryption
│   └── storage/          # File storage
│
├── frontend/             # React + Vite application
│   ├── src/
│   │   ├── config/       # API configuration
│   │   ├── store/        # Zustand state management
│   │   ├── services/     # API services (6 services)
│   │   ├── layouts/      # Layout components
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components (13 pages)
│   │   └── App.jsx       # Main app with routing
│   └── public/           # Static assets
│
└── docs/                 # Documentation
```

## 📚 API Documentation

**60+ API Endpoints** organized into modules:

- **Authentication** (13 endpoints): Register, login, 2FA, email verification, password reset
- **Domains** (17 endpoints): Search, register, transfer, DNS, contacts, renewal
- **Invoices** (9 endpoints): List, view, pay, generate PDF, admin operations
- **Payments** (7 endpoints): Razorpay & Stripe integration, webhooks, refunds
- **Wallet** (6 endpoints): Balance, transactions, add funds, pay invoices
- **Cart** (8 endpoints): Add, update, remove items, coupon, checkout

See `backend/SaaSify_API_Collection.postman_collection.json` for full API documentation.

## 🗄️ Database Models

1. **User**: Authentication & roles
2. **Client**: Customer profiles
3. **Domain**: Domain registrations
4. **Product**: Service catalog
5. **Order**: Purchase orders
6. **Service**: Active services
7. **Invoice**: Billing documents
8. **Transaction**: Payment records
9. **Wallet**: Customer balances
10. **ActivityLog**: Audit trail

## 🔐 Environment Variables

### Backend `.env`
```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/saasify
REDIS_URL=redis://localhost:6379

JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

GODADDY_API_KEY=your-godaddy-key
GODADDY_API_SECRET=your-godaddy-secret

RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### Frontend `.env`
```env
VITE_API_URL=http://localhost:5000/api
```

## 🧪 Testing

Import the Postman collection:
```bash
backend/SaaSify_API_Collection.postman_collection.json
```

## 📖 Documentation

- [Complete Project Documentation](PROJECT_COMPLETE.md)
- [Phase 1: Authentication](backend/PHASE1_WEEK1_COMPLETE.md)
- [Phase 2: Domain Management](backend/PHASE2_WEEK4_COMPLETE.md)
- [Phase 3: Payments & Billing](backend/PHASE3_PAYMENTS_COMPLETE.md)
- [Phase 4: Frontend](frontend/PHASE4_FRONTEND_COMPLETE.md)
- [Workers Documentation](backend/WORKERS_README.md)
- [Final Documentation](FINAL_DOCUMENTATION.md)

## 🎯 Future Enhancements

- Support ticket system
- Live chat integration
- Advanced analytics & reporting
- Bulk domain operations
- Hosting services (Shared, VPS, Dedicated)
- Mobile application
- White-label solution

## 🐛 Troubleshooting

**MongoDB connection error**: Ensure MongoDB is running on port 27017
**Redis connection error**: Start Redis with `redis-server`
**Frontend can't connect**: Check VITE_API_URL matches backend URL
**Workers not running**: Start with `npm run workers` in backend folder

## 📦 Deployment

See [PROJECT_COMPLETE.md](PROJECT_COMPLETE.md) for detailed deployment instructions.

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

Built with modern technologies and best practices for production-ready hosting platforms.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Production Ready ✅
