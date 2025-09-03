# SportDogLog API

Backend API for SportDogLog iOS app with RevenueCat + Stripe integration.

## Overview

This API handles:
- Creating Stripe checkout sessions for subscription purchases
- Processing Stripe webhooks for subscription events
- Updating RevenueCat subscriber data and entitlements
- Validating payments and managing subscription lifecycle

## Architecture

- **Node.js** with Express framework
- **Stripe** for payment processing
- **RevenueCat** for subscription management and cross-platform support
- Webhook-driven subscription updates

## API Endpoints

### Stripe Checkout
- `POST /api/stripe/create-checkout-session` - Create checkout session
- `GET /api/stripe/checkout-session/:sessionId` - Get session details
- `GET /api/stripe/subscription/:subscriptionId` - Get subscription details

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Health Check
- `GET /health` - Server health status

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

3. **Required environment variables:**
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Stripe webhook endpoint secret
   - `REVENUECAT_API_KEY` - RevenueCat API key
   - `MONTHLY_PRICE_ID` - Stripe price ID for monthly plan
   - `ANNUAL_PRICE_ID` - Stripe price ID for annual plan
   - `APP_BUNDLE_ID` - iOS app bundle identifier

## Development

Start development server:
```bash
npm run dev
```

The server will run on `http://localhost:3000`

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Docker
```bash
docker build -t sportdoglog-api .
docker run -p 3000:3000 --env-file .env sportdoglog-api
```

## Webhook Configuration

### Stripe Webhooks
Configure webhook endpoint in Stripe Dashboard:
- **URL:** `https://your-domain.com/api/webhooks/stripe`
- **Events to send:**
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

## iOS Integration

Update your iOS PaywallView to call the checkout endpoint:

```swift
func createStripeCheckout(for planType: String, userId: String) async throws -> String {
    let url = URL(string: "https://your-api-domain.com/api/stripe/create-checkout-session")!
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    
    let priceId = planType == "monthly" ? "price_monthly_id" : "price_annual_id"
    
    let body = [
        "priceId": priceId,
        "userId": userId,
        "planType": planType
    ]
    
    request.httpBody = try JSONSerialization.data(withJSONObject: body)
    
    let (data, _) = try await URLSession.shared.data(for: request)
    let response = try JSONDecoder().decode(CheckoutResponse.self, from: data)
    
    return response.url
}

struct CheckoutResponse: Codable {
    let sessionId: String
    let url: String
}
```

## Security Features

- Input validation and sanitization
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Webhook signature verification
- Environment variable validation

## Error Handling

The API provides detailed error responses with:
- HTTP status codes
- Error messages
- Request timestamps
- Validation details (in development)

## Monitoring

- Health check endpoint at `/health`
- Comprehensive logging for debugging
- Error tracking with stack traces (development only)

## Support

For issues or questions:
- Check the logs for detailed error information
- Verify webhook signatures in Stripe Dashboard
- Test API endpoints with provided examples
- Review environment variable configuration