# 🚀 SaaSify Quick Start Guide

This guide will help you get the SaaSify platform up and running in minutes.

## Prerequisites Checklist

Before starting, ensure you have:
- [ ] Node.js 16+ installed (`node --version`)
- [ ] MongoDB installed and running
- [ ] Redis installed and running
- [ ] Git installed

## Step 1: Clone and Navigate

```bash
# If you haven't cloned yet
git clone <your-repo-url>

# Navigate to project
cd SaaSify
```

## Step 2: Backend Setup (5 minutes)

### 2.1 Install Dependencies
```bash
cd backend
npm install
```

### 2.2 Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your editor
nano .env
```

**Minimum required variables**:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/saasify
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-characters
```

### 2.3 Start Services

**Terminal 1 - MongoDB**:
```bash
# If MongoDB not running as service
mongod
```

**Terminal 2 - Redis**:
```bash
# If Redis not running as service
redis-server
```

### 2.4 Create Database Indexes
```bash
npm run create-indexes
```

### 2.5 Start Backend
```bash
npm run dev
```

✅ Backend should now be running on http://localhost:5000

Test it: Open http://localhost:5000/api/health in your browser

## Step 3: Frontend Setup (3 minutes)

**Open a new terminal window**

### 3.1 Install Dependencies
```bash
cd frontend
npm install
```

### 3.2 Configure Environment
```bash
# Copy environment template
cp .env.example .env
```

The default `.env` should work:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3.3 Start Frontend
```bash
npm run dev
```

✅ Frontend should now be running on http://localhost:5173

## Step 4: Verify Installation

### Test the Application

1. **Open Frontend**: http://localhost:5173
2. **Register a new account**: Click "Sign Up"
3. **Fill the registration form**:
   - First Name: Test
   - Last Name: User
   - Email: test@example.com
   - Password: TestPassword123
4. **Click Register**

You should see a success message and be redirected to login.

## Step 5: Optional - Start Background Workers

**Open a new terminal window**

```bash
cd backend
npm run workers
```

This starts 5 background workers for:
- Domain registration
- Domain renewal
- Domain transfer
- DNS updates
- Email notifications

## Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Solution**:
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
mongod --dbpath /path/to/data/db
```

### Issue: Redis Connection Failed
**Solution**:
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
redis-server
```

### Issue: Port Already in Use
**Solution**:
```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

### Issue: npm install fails
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### Starting Everything (recommended order)

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - Workers** (optional):
```bash
cd backend
npm run workers
```

**Terminal 4 - MongoDB** (if not running as service):
```bash
mongod
```

**Terminal 5 - Redis** (if not running as service):
```bash
redis-server
```

### Stopping Everything

Press `Ctrl+C` in each terminal window to stop the respective service.

## Next Steps

Now that you have the platform running:

1. **Explore the Dashboard**: Login and check the dashboard features
2. **Test Domain Search**: Navigate to "Search Domains" (placeholder for now)
3. **Check Wallet**: View your wallet balance (will be $0)
4. **View Invoices**: Check the invoices page
5. **Update Profile**: Go to Profile settings

## API Testing with Postman

1. **Import the collection**:
   - Open Postman
   - Import `backend/SaaSify_API_Collection.postman_collection.json`

2. **Set up environment**:
   - Create new environment
   - Add variable: `baseUrl` = `http://localhost:5000`

3. **Test endpoints**:
   - Start with Authentication folder
   - Register a user
   - Login to get JWT token
   - Token will be automatically used in subsequent requests

## Environment Setup for Production

When moving to production:

### Backend
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/saasify
REDIS_URL=redis://your-redis-host:6379

# Use strong secrets (32+ characters)
JWT_SECRET=generate-strong-secret-key-here
JWT_REFRESH_SECRET=generate-another-strong-secret-key

# Configure email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com

# Add payment gateway credentials
RAZORPAY_KEY_ID=your-live-key
RAZORPAY_KEY_SECRET=your-live-secret
STRIPE_SECRET_KEY=sk_live_your-key
STRIPE_PUBLISHABLE_KEY=pk_live_your-key

# Add GoDaddy credentials for domain operations
GODADDY_API_KEY=your-production-key
GODADDY_API_SECRET=your-production-secret

# Set frontend URL for CORS
FRONTEND_URL=https://yourdomain.com
```

### Frontend
```env
VITE_API_URL=https://api.yourdomain.com/api
```

## Useful Commands

### Backend Commands
```bash
npm run dev          # Start development server
npm start            # Start production server
npm run workers      # Start background workers
npm run create-indexes   # Create database indexes
npm run rebuild-indexes  # Rebuild indexes
npm run seed         # Seed test data (if available)
```

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## Default Admin Access

The platform uses role-based access. To create an admin user:

1. **Register normally** through the UI
2. **Update the database** directly:
```javascript
// In MongoDB shell or MongoDB Compass
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

## Monitoring Logs

### Backend Logs
Logs are stored in `backend/logs/`:
- `combined.log` - All logs
- `error.log` - Error logs only

View logs in real-time:
```bash
# Combined logs
tail -f backend/logs/combined.log

# Errors only
tail -f backend/logs/error.log
```

## Database Inspection

### MongoDB
```bash
# Open MongoDB shell
mongosh

# Use database
use saasify

# View collections
show collections

# View users
db.users.find().pretty()

# View domains
db.domains.find().pretty()
```

### Redis
```bash
# Open Redis CLI
redis-cli

# View all keys
KEYS *

# Get value
GET key_name

# Monitor commands
MONITOR
```

## Getting Help

If you encounter issues:

1. **Check Documentation**:
   - [PROJECT_COMPLETE.md](PROJECT_COMPLETE.md) - Full documentation
   - [Backend README](backend/README.md) - Backend specific info
   - [Frontend README](frontend/README.md) - Frontend specific info

2. **Check Logs**:
   - Backend: `backend/logs/`
   - Browser Console: F12 → Console tab
   - Network tab: F12 → Network tab

3. **Common Debugging**:
   ```bash
   # Check if services are running
   ps aux | grep node    # Node processes
   ps aux | grep mongod  # MongoDB
   ps aux | grep redis   # Redis
   
   # Check ports
   lsof -i :5000  # Backend
   lsof -i :5173  # Frontend
   lsof -i :27017 # MongoDB
   lsof -i :6379  # Redis
   ```

## Success Checklist

- [ ] MongoDB running and accessible
- [ ] Redis running and accessible
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Can access frontend at http://localhost:5173
- [ ] Can register a new user
- [ ] Can login successfully
- [ ] Dashboard loads without errors
- [ ] No console errors in browser

## What's Next?

Now that you're set up:

1. **Customize the Platform**: Modify branding, colors, features
2. **Add Domain Features**: Configure GoDaddy API for real domain operations
3. **Setup Payments**: Add Razorpay/Stripe credentials
4. **Configure Email**: Setup SMTP for email notifications
5. **Deploy to Production**: Follow deployment guides
6. **Add More Features**: Check future enhancements in README

---

**Congratulations! You're ready to use SaaSify! 🎉**

For detailed documentation, see [PROJECT_COMPLETE.md](PROJECT_COMPLETE.md)
