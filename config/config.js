/**
 * Configuration variables for the application
 */
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Default configurations
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
  },
  
  // Database configuration
  database: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/jasper-legal-assistant',
  },
  
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your_secret_key_change_this_in_production',
    expiresIn: '24h',
  },
  
  // Security configuration
  security: {
    maxLoginAttempts: 5,
    lockoutTime: 30 * 60 * 1000, // 30 minutes
    passwordResetExpires: 60 * 60 * 1000, // 1 hour
  },
  
  // API keys
  api: {
    crimecheck: process.env.CRIMECHECK_API_KEY,
    blackbox: process.env.BLACKBOX_API_KEY,
    google: {
      apiKey: process.env.GOOGLE_CUSTOM_SEARCH_API_KEY,
      searchEngineId: process.env.GOOGLE_CUSTOM_SEARCH_ID,
    },
    news: process.env.NEWS_API_KEY,
  },
  
  // Encryption for sensitive data
  encryption: {
    key: process.env.CONFIG_ENCRYPTION_KEY || 'your_encryption_key_for_config_change_this_in_production',
  },
};

module.exports = config;