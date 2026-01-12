const BasePlatform = require('./BasePlatform');
const axios = require('axios');

class WhatsAppService extends BasePlatform {
  constructor(account) {
    super(account);
    this.apiBase = 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = account.platformUserId;
  }

  async sendMessage({ recipientId, content, messageType = 'text', mediaUrl }) {
    const messageData = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientId
    };

    switch (messageType) {
      case 'text':
        messageData.type = 'text';
        messageData.text = { body: content };
        break;

      case 'image':
        messageData.type = 'image';
        messageData.image = {
          link: mediaUrl,
          caption: content
        };
        break;

      case 'video':
        messageData.type = 'video';
        messageData.video = {
          link: mediaUrl,
          caption: content
        };
        break;

      case 'document':
        messageData.type = 'document';
        messageData.document = {
          link: mediaUrl,
          caption: content
        };
        break;

      case 'template':
        messageData.type = 'template';
        messageData.template = {
          name: content,
          language: { code: 'en' }
        };
        break;

      default:
        messageData.type = 'text';
        messageData.text = { body: content };
    }

    const response = await axios.post(
      `${this.apiBase}/${this.phoneNumberId}/messages`,
      messageData,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return {
      messageId: response.data.messages[0].id,
      conversationId: recipientId
    };
  }

  async sendTemplateMessage(recipientId, templateName, components = []) {
    const response = await axios.post(
      `${this.apiBase}/${this.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: recipientId,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components
        }
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  async markAsRead(messageId) {
    await axios.post(
      `${this.apiBase}/${this.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }

  async uploadMedia(filePath, mimeType) {
    const FormData = require('form-data');
    const fs = require('fs');

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('type', mimeType);
    form.append('messaging_product', 'whatsapp');

    const response = await axios.post(
      `${this.apiBase}/${this.phoneNumberId}/media`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    );

    return response.data.id;
  }

  async getMediaUrl(mediaId) {
    const response = await axios.get(
      `${this.apiBase}/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    );

    return response.data.url;
  }

  async getBusinessProfile() {
    const response = await axios.get(
      `${this.apiBase}/${this.phoneNumberId}/whatsapp_business_profile`,
      {
        params: {
          fields: 'about,address,description,email,profile_picture_url,websites,vertical'
        },
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      }
    );

    return response.data.data[0];
  }

  async updateBusinessProfile(profileData) {
    const response = await axios.post(
      `${this.apiBase}/${this.phoneNumberId}/whatsapp_business_profile`,
      {
        messaging_product: 'whatsapp',
        ...profileData
      },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  // WhatsApp doesn't support "posts" in the traditional sense
  async publishPost() {
    throw new Error('WhatsApp does not support posts. Use sendMessage instead.');
  }

  async getAnalytics() {
    // WhatsApp Business API analytics are available through Business Manager
    return {
      message: 'Analytics available through Meta Business Suite'
    };
  }
}

module.exports = WhatsAppService;
