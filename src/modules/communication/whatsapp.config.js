import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * WhatsApp Business API Configuration
 * This is a modular configuration that can be used across any project
 * Ensure these environment variables are set:
 * - WHATSAPP_BUSINESS_ACCOUNT_ID
 * - WHATSAPP_BUSINESS_API_TOKEN
 * - WHATSAPP_BUSINESS_PHONE_NUMBER_ID
 */

const whatsappConfig = {
  accountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  apiToken: process.env.WHATSAPP_BUSINESS_API_TOKEN,
  phoneNumberId: process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID,
  apiVersion: 'v18.0', // Update to latest version as needed
  baseUrl: 'https://graph.instagram.com',
};

// Validate configuration
if (!whatsappConfig.accountId || !whatsappConfig.apiToken || !whatsappConfig.phoneNumberId) {
  console.warn('⚠️  WhatsApp Business API credentials are not fully configured. WhatsApp features will not work.');
}

export default whatsappConfig;
