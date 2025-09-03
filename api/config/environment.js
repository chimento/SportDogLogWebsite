// Environment configuration validation
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'REVENUECAT_API_KEY',
  'MONTHLY_PRICE_ID',
  'ANNUAL_PRICE_ID',
  'APP_BUNDLE_ID'
];

const optionalEnvVars = [
  'PORT',
  'NODE_ENV',
  'FRONTEND_URL',
  'REVENUECAT_PUBLIC_KEY'
];

function validateEnvironment() {
  const missing = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach(var_name => console.error(`  - ${var_name}`));
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
  }
  
  // Validate Stripe keys format
  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    console.error('Invalid STRIPE_SECRET_KEY format. Should start with "sk_"');
    process.exit(1);
  }
  
  if (!process.env.STRIPE_WEBHOOK_SECRET.startsWith('whsec_')) {
    console.error('Invalid STRIPE_WEBHOOK_SECRET format. Should start with "whsec_"');
    process.exit(1);
  }
  
  // Validate price IDs format
  if (!process.env.MONTHLY_PRICE_ID.startsWith('price_')) {
    console.error('Invalid MONTHLY_PRICE_ID format. Should start with "price_"');
    process.exit(1);
  }
  
  if (!process.env.ANNUAL_PRICE_ID.startsWith('price_')) {
    console.error('Invalid ANNUAL_PRICE_ID format. Should start with "price_"');
    process.exit(1);
  }
  
  console.log('✅ Environment configuration is valid');
}

function getConfig() {
  return {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'https://sportdoglog.com',
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      monthlyPriceId: process.env.MONTHLY_PRICE_ID,
      annualPriceId: process.env.ANNUAL_PRICE_ID
    },
    revenuecat: {
      apiKey: process.env.REVENUECAT_API_KEY,
      publicKey: process.env.REVENUECAT_PUBLIC_KEY
    },
    app: {
      bundleId: process.env.APP_BUNDLE_ID
    }
  };
}

module.exports = {
  validateEnvironment,
  getConfig
};