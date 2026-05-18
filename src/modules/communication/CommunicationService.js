import axios from 'axios';
import whatsappConfig from './whatsapp.config.js';

/**
 * CommunicationService - Modular WhatsApp & Multi-Channel Communication
 * Can be reused in any Node.js/Express project
 * 
 * Features:
 * - Send WhatsApp messages (text, templates, media)
 * - Send SMS/Twilio messages (optional)
 * - Template-based messaging
 * - Bulk messaging
 * - Message scheduling (ready for implementation)
 * - Support for multiple communication channels
 */

class CommunicationService {
  /**
   * Send WhatsApp text message
   * @param {string} phoneNumber - Recipient phone number with country code (e.g., '91XXXXXXXXXX')
   * @param {string} message - Message text to send
   * @returns {Promise<Object>} Message send result
   */
  async sendWhatsAppMessage(phoneNumber, message) {
    try {
      if (!this._validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format. Use format: 91XXXXXXXXXX');
      }

      const url = `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message,
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${whatsappConfig.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data,
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Send WhatsApp template message
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} templateName - WhatsApp template name
   * @param {Array} templateParameters - Template parameters/variables
   * @param {string} languageCode - Language code (default: 'en')
   * @returns {Promise<Object>} Message send result
   */
  async sendWhatsAppTemplate(phoneNumber, templateName, templateParameters = [], languageCode = 'en') {
    try {
      if (!this._validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format. Use format: 91XXXXXXXXXX');
      }

      const url = `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`;

      const components = [
        {
          type: 'body',
          parameters: templateParameters.map(param => ({ type: 'text', text: param })),
        },
      ];

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components,
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${whatsappConfig.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data,
      };
    } catch (error) {
      console.error('Error sending WhatsApp template:', error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Send WhatsApp media message (image, video, document)
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} mediaUrl - URL of the media file
   * @param {string} mediaType - Type of media: 'image', 'video', 'document', 'audio'
   * @param {string} caption - Caption for the media (optional)
   * @returns {Promise<Object>} Message send result
   */
  async sendWhatsAppMedia(phoneNumber, mediaUrl, mediaType = 'image', caption = '') {
    try {
      if (!this._validatePhoneNumber(phoneNumber)) {
        throw new Error('Invalid phone number format. Use format: 91XXXXXXXXXX');
      }

      const validMediaTypes = ['image', 'video', 'document', 'audio'];
      if (!validMediaTypes.includes(mediaType)) {
        throw new Error(`Invalid media type. Supported types: ${validMediaTypes.join(', ')}`);
      }

      const url = `${whatsappConfig.baseUrl}/${whatsappConfig.apiVersion}/${whatsappConfig.phoneNumberId}/messages`;

      const mediaObject = {
        link: mediaUrl,
      };

      if (caption && mediaType !== 'audio' && mediaType !== 'document') {
        mediaObject.caption = caption;
      }

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: mediaType,
        [mediaType]: mediaObject,
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${whatsappConfig.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        data: response.data,
      };
    } catch (error) {
      console.error(`Error sending WhatsApp ${mediaType}:`, error.message);
      return {
        success: false,
        error: error.message,
        details: error.response?.data,
      };
    }
  }

  /**
   * Send bulk WhatsApp messages
   * @param {Array} recipients - Array of {phoneNumber, message} objects
   * @returns {Promise<Object>} Bulk send result
   */
  async sendBulkWhatsAppMessages(recipients) {
    try {
      const results = [];
      let successCount = 0;
      let failureCount = 0;

      for (const recipient of recipients) {
        const result = await this.sendWhatsAppMessage(recipient.phoneNumber, recipient.message);
        results.push({
          phoneNumber: recipient.phoneNumber,
          ...result,
        });

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      return {
        success: failureCount === 0,
        successCount,
        failureCount,
        results,
      };
    } catch (error) {
      console.error('Error sending bulk WhatsApp messages:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send notification for successful booking
   * @param {Object} options - Notification options
   * @param {string} options.phoneNumber - Customer phone number
   * @param {string} options.customerName - Customer name
   * @param {string} options.bookingType - Type of booking (darshan, pooja, donation)
   * @param {string} options.bookingId - Booking reference ID
   * @param {string} options.amount - Booking amount
   * @param {string} options.date - Booking date
   * @returns {Promise<Object>} Send result
   */
  async sendBookingConfirmation(options) {
    try {
      const {
        phoneNumber,
        customerName,
        bookingType,
        bookingId,
        amount,
        date,
      } = options;

      const message = `🙏 Thank you for your booking!

Dear ${customerName},

Your ${bookingType} booking has been confirmed!

📋 Booking ID: ${bookingId}
💰 Amount: ₹${amount}
📅 Date: ${date}

We look forward to serving you. 
For any queries, please contact us.

🕉️ *Hari Om Tat Sat*`;

      return await this.sendWhatsAppMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error sending booking confirmation:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send payment success notification
   * @param {Object} options - Notification options
   * @param {string} options.phoneNumber - Customer phone number
   * @param {string} options.customerName - Customer name
   * @param {string} options.amount - Payment amount
   * @param {string} options.orderId - Order/Payment reference ID
   * @param {string} options.transactionId - Transaction ID
   * @returns {Promise<Object>} Send result
   */
  async sendPaymentConfirmation(options) {
    try {
      const {
        phoneNumber,
        customerName,
        amount,
        orderId,
        transactionId,
      } = options;

      const message = `✅ Payment Received!

Dear ${customerName},

Your payment of ₹${amount} has been received successfully.

📋 Order ID: ${orderId}
🔑 Transaction ID: ${transactionId}

Thank you for your generous contribution.

🕉️ *Hari Om Tat Sat*`;

      return await this.sendWhatsAppMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error sending payment confirmation:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send reminder notification
   * @param {Object} options - Notification options
   * @param {string} options.phoneNumber - Customer phone number
   * @param {string} options.customerName - Customer name
   * @param {string} options.eventType - Type of event (darshan, pooja, etc.)
   * @param {string} options.eventDate - Event date and time
   * @returns {Promise<Object>} Send result
   */
  async sendReminder(options) {
    try {
      const {
        phoneNumber,
        customerName,
        eventType,
        eventDate,
      } = options;

      const message = `⏰ Gentle Reminder

Dear ${customerName},

This is a friendly reminder for your upcoming ${eventType}.

📅 Date & Time: ${eventDate}

Please ensure you arrive on time. For any changes, please contact us immediately.

🕉️ *Hari Om Tat Sat*`;

      return await this.sendWhatsAppMessage(phoneNumber, message);
    } catch (error) {
      console.error('Error sending reminder:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validate phone number format
   * @private
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if valid format
   */
  _validatePhoneNumber(phoneNumber) {
    // Basic validation: should be country code + 10 digits
    // E.g., 91XXXXXXXXXX for India
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phoneNumber);
  }
}

export default new CommunicationService();
