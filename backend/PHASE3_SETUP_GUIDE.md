# Phase 3 Setup & Testing Guide

## Quick Start

### 1. Install Dependencies
All required packages are already in package.json:
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- **Razorpay**: Sign up at https://razorpay.com/
- **Stripe**: Sign up at https://stripe.com/
- Use test/sandbox keys for development

### 3. Start Services

**MongoDB** (if not running):
```bash
mongod
```

**Redis** (required for queues):
```bash
redis-server
```

**Backend Server**:
```bash
npm run dev
```

**Workers** (in separate terminal):
```bash
npm run workers
```

**Cron Jobs** (in separate terminal):
```bash
npm run cron
```

---

## Testing Payment Features

### 1. Test Invoice Creation

**Create a test invoice (Admin):**
```bash
curl -X POST http://localhost:5000/api/invoices/admin/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "clientId": "CLIENT_ID",
    "items": [{
      "type": "domain",
      "description": "example.com - 1 year registration",
      "quantity": 1,
      "unitPrice": 12.99,
      "discount": 0,
      "taxAmount": 0
    }]
  }'
```

**List invoices:**
```bash
curl http://localhost:5000/api/invoices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Download PDF:**
```bash
curl http://localhost:5000/api/invoices/INVOICE_ID/pdf \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output invoice.pdf
```

### 2. Test Razorpay Payment

**Step 1: Create Razorpay Order**
```bash
curl -X POST http://localhost:5000/api/payments/razorpay/create-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100.00,
    "currency": "INR",
    "invoiceId": "INVOICE_ID"
  }'
```

**Step 2: Integrate with Frontend**
Use the returned `orderId` and `keyId` with Razorpay Checkout on frontend.

**Step 3: Verify Payment**
```bash
curl -X POST http://localhost:5000/api/payments/razorpay/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "signature_xxx",
    "invoiceId": "INVOICE_ID"
  }'
```

**Test Webhook** (use ngrok for local testing):
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 5000

# Add webhook URL in Razorpay Dashboard:
# https://your-ngrok-url.ngrok.io/api/payments/razorpay/webhook
```

### 3. Test Stripe Payment

**Step 1: Create Payment Intent**
```bash
curl -X POST http://localhost:5000/api/payments/stripe/create-intent \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100.00,
    "currency": "usd",
    "invoiceId": "INVOICE_ID"
  }'
```

**Step 2: Get Publishable Key**
```bash
curl http://localhost:5000/api/payments/stripe/config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Step 3: Test Webhook** (use Stripe CLI):
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Forward webhooks to local server
stripe listen --forward-to localhost:5000/api/payments/stripe/webhook

# Test payment
stripe trigger payment_intent.succeeded
```

### 4. Test Wallet System

**Check Balance:**
```bash
curl http://localhost:5000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Add Funds** (after Razorpay/Stripe payment):
```bash
curl -X POST http://localhost:5000/api/wallet/add-funds \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 100.00,
    "gateway": "razorpay",
    "paymentData": {
      "razorpay_payment_id": "pay_xxx",
      "razorpay_order_id": "order_xxx",
      "razorpay_signature": "signature_xxx"
    }
  }'
```

**Pay Invoice from Wallet:**
```bash
curl -X POST http://localhost:5000/api/wallet/pay-invoice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "invoiceId": "INVOICE_ID"
  }'
```

**Admin Wallet Adjustment:**
```bash
curl -X POST http://localhost:5000/api/wallet/admin/adjust \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "clientId": "CLIENT_ID",
    "amount": 50.00,
    "type": "credit",
    "reason": "Promotional credit"
  }'
```

### 5. Test Refunds

**Create Refund (Admin):**
```bash
curl -X POST http://localhost:5000/api/payments/refund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "transactionId": "TRANSACTION_ID",
    "amount": 50.00,
    "reason": "Customer request"
  }'
```

**Get Refund Status:**
```bash
curl http://localhost:5000/api/payments/refund/REFUND_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Testing Automation

### Payment Reminders
Create an invoice with past due date:
```javascript
// In MongoDB shell or Compass
db.invoices.updateOne(
  { invoiceNumber: "INV-202401-0001" },
  { 
    $set: { 
      status: "unpaid",
      dueDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
    } 
  }
);
```

Wait for cron job or manually trigger:
```bash
# Check logs for payment reminder emails
npm run cron
```

### Service Suspension
Invoice must be 7+ days overdue. Check service status after cron runs.

### Service Termination
Invoice must be 30+ days overdue. Service will be terminated automatically.

---

## Postman Collection

Import the Postman collection for easier testing:
```bash
# File location
backend/SaaSify_API_Collection.postman_collection.json
```

**Update collection to include Phase 3 endpoints:**
- Add Invoice folder with 9 endpoints
- Add Payment folder with 10 endpoints
- Add Wallet folder with 6 endpoints

---

## Troubleshooting

### PDF Generation Fails
```bash
# Create storage directory
mkdir -p backend/storage/invoices

# Check permissions
chmod 755 backend/storage
chmod 755 backend/storage/invoices
```

### Webhook Signature Fails
- Verify webhook secrets in `.env`
- Use raw body parser for webhooks (already configured)
- Check webhook logs in dashboard

### Payment Not Completing
- Check Redis is running (required for queues)
- Verify gateway credentials in `.env`
- Check browser console for frontend errors
- Review server logs: `tail -f logs/combined.log`

### Email Not Sending
- Verify EMAIL_* variables in `.env`
- Check email worker is running: `npm run workers`
- For Gmail: Use app-specific password, enable 2FA

### Cron Jobs Not Running
```bash
# Check if cron process is running
ps aux | grep cron

# View cron logs
tail -f logs/combined.log | grep cron

# Manually test a cron job
node src/cron/paymentReminders.cron.js
```

---

## Database Queries

**Check invoice statistics:**
```javascript
// In MongoDB shell
use saasify;

// Count by status
db.invoices.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);

// Find overdue invoices
db.invoices.find({ 
  status: "unpaid", 
  dueDate: { $lt: new Date() } 
}).pretty();

// Revenue summary
db.invoices.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: null, total: { $sum: "$total" } } }
]);
```

**Check wallet balances:**
```javascript
db.clients.aggregate([
  { $group: { 
    _id: null, 
    totalWalletBalance: { $sum: "$walletBalance" },
    avgBalance: { $avg: "$walletBalance" }
  }}
]);
```

**Check transaction history:**
```javascript
db.transactions.find({ 
  gateway: "wallet",
  createdAt: { $gte: new Date("2024-01-01") }
}).sort({ createdAt: -1 }).limit(10).pretty();
```

---

## Security Checklist

- [ ] Change all secrets in `.env`
- [ ] Use HTTPS in production
- [ ] Verify webhook signatures
- [ ] Validate payment amounts server-side
- [ ] Rate limit payment endpoints
- [ ] Log all payment transactions
- [ ] Encrypt sensitive data in database
- [ ] Use environment-specific API keys
- [ ] Enable Stripe/Razorpay webhooks monitoring
- [ ] Set up payment reconciliation reports

---

## Production Deployment

### Before Going Live:

1. **Switch to Production API Keys**
   - Razorpay: Live mode keys
   - Stripe: Live mode keys
   - Update webhook secrets

2. **Configure Webhooks**
   - Razorpay Dashboard → Add webhook URL
   - Stripe Dashboard → Add webhook endpoint
   - Test webhook delivery

3. **Set Up Monitoring**
   - Payment success/failure rates
   - Refund rates
   - Webhook delivery status
   - Cron job execution logs

4. **Database Backups**
   - Schedule regular MongoDB backups
   - Test restore procedures
   - Monitor transaction logs

5. **Email Configuration**
   - Use transactional email service (SendGrid, Mailgun)
   - Verify email deliverability
   - Test all email templates

6. **Load Testing**
   - Test concurrent payments
   - Test webhook processing under load
   - Monitor queue performance

---

## API Documentation

Complete API documentation with examples: [PHASE3_PAYMENTS_COMPLETE.md](./PHASE3_PAYMENTS_COMPLETE.md)

Endpoint summary:
- **Invoices**: 9 endpoints
- **Payments**: 10 endpoints  
- **Wallet**: 6 endpoints
- **Total**: 25 new endpoints

---

## Support

For issues or questions:
1. Check logs: `tail -f logs/combined.log`
2. Review documentation: `PHASE3_PAYMENTS_COMPLETE.md`
3. Test with Postman collection
4. Verify environment variables
5. Check service status (MongoDB, Redis)

---

**Phase 3 Complete!** 🎉

Ready to move to Phase 4: Frontend Development
