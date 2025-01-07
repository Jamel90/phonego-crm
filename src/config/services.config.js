const env = import.meta.env.MODE || 'development'

const config = {
  development: {
    apiBaseUrl: 'http://localhost:5001/phonego-crm/us-central1/api'
  },
  production: {
    apiBaseUrl: 'https://us-central1-phonego-crm.cloudfunctions.net/api'
  }
}

export const servicesConfig = {
  ...config[env],
  twilio: {
    accountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID,
    authToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN,
    phoneNumber: import.meta.env.VITE_TWILIO_PHONE_NUMBER,
  },
  sendgrid: {
    apiKey: import.meta.env.VITE_SENDGRID_API_KEY,
    fromEmail: import.meta.env.VITE_SENDGRID_FROM_EMAIL,
  },
  stripe: {
    publicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY,
    monthlyPriceId: import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID,
    yearlyPriceId: import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID,
  }
}
