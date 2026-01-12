const BasePlatform = require('./BasePlatform');
const { Telegraf } = require('telegraf');
const axios = require('axios');

class TelegramService extends BasePlatform {
  constructor(account) {
    super(account);
    this.botToken = account.accessToken;
    this.apiBase = `https://api.telegram.org/bot${this.botToken}`;
    this.bot = new Telegraf(this.botToken);
  }

  async sendMessage({ recipientId, content, messageType = 'text', mediaUrl }) {
    let response;

    switch (messageType) {
      case 'text':
        response = await axios.post(`${this.apiBase}/sendMessage`, {
          chat_id: recipientId,
          text: content,
          parse_mode: 'HTML'
        });
        break;

      case 'image':
        response = await axios.post(`${this.apiBase}/sendPhoto`, {
          chat_id: recipientId,
          photo: mediaUrl,
          caption: content,
          parse_mode: 'HTML'
        });
        break;

      case 'video':
        response = await axios.post(`${this.apiBase}/sendVideo`, {
          chat_id: recipientId,
          video: mediaUrl,
          caption: content,
          parse_mode: 'HTML'
        });
        break;

      case 'document':
        response = await axios.post(`${this.apiBase}/sendDocument`, {
          chat_id: recipientId,
          document: mediaUrl,
          caption: content,
          parse_mode: 'HTML'
        });
        break;

      case 'audio':
        response = await axios.post(`${this.apiBase}/sendAudio`, {
          chat_id: recipientId,
          audio: mediaUrl,
          caption: content
        });
        break;

      default:
        response = await axios.post(`${this.apiBase}/sendMessage`, {
          chat_id: recipientId,
          text: content,
          parse_mode: 'HTML'
        });
    }

    return {
      messageId: response.data.result.message_id.toString(),
      conversationId: recipientId
    };
  }

  async publishPost(post) {
    // For Telegram, "posting" means sending to a channel
    const channelId = post.metadata?.channelId || this.account.metadata?.defaultChannelId;

    if (!channelId) {
      throw new Error('Channel ID is required for Telegram posts');
    }

    let response;

    if (post.mediaUrls && post.mediaUrls.length > 0) {
      if (post.contentType === 'image') {
        response = await axios.post(`${this.apiBase}/sendPhoto`, {
          chat_id: channelId,
          photo: post.mediaUrls[0],
          caption: post.content,
          parse_mode: 'HTML'
        });
      } else if (post.contentType === 'video') {
        response = await axios.post(`${this.apiBase}/sendVideo`, {
          chat_id: channelId,
          video: post.mediaUrls[0],
          caption: post.content,
          parse_mode: 'HTML'
        });
      } else if (post.mediaUrls.length > 1) {
        // Media group
        const media = post.mediaUrls.map((url, index) => ({
          type: 'photo',
          media: url,
          caption: index === 0 ? post.content : undefined,
          parse_mode: index === 0 ? 'HTML' : undefined
        }));

        response = await axios.post(`${this.apiBase}/sendMediaGroup`, {
          chat_id: channelId,
          media
        });
      }
    } else {
      response = await axios.post(`${this.apiBase}/sendMessage`, {
        chat_id: channelId,
        text: post.content,
        parse_mode: 'HTML'
      });
    }

    const messageId = Array.isArray(response.data.result)
      ? response.data.result[0].message_id
      : response.data.result.message_id;

    return {
      id: messageId.toString(),
      url: channelId.startsWith('@')
        ? `https://t.me/${channelId.substring(1)}/${messageId}`
        : null
    };
  }

  async editMessage(chatId, messageId, newContent) {
    const response = await axios.post(`${this.apiBase}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text: newContent,
      parse_mode: 'HTML'
    });

    return response.data;
  }

  async deleteMessage(chatId, messageId) {
    await axios.post(`${this.apiBase}/deleteMessage`, {
      chat_id: chatId,
      message_id: messageId
    });

    return true;
  }

  async getUpdates(offset = 0) {
    const response = await axios.get(`${this.apiBase}/getUpdates`, {
      params: { offset, limit: 100 }
    });

    return response.data.result;
  }

  async setWebhook(url) {
    const response = await axios.post(`${this.apiBase}/setWebhook`, {
      url,
      allowed_updates: ['message', 'channel_post', 'callback_query']
    });

    return response.data;
  }

  async getChatInfo(chatId) {
    const response = await axios.get(`${this.apiBase}/getChat`, {
      params: { chat_id: chatId }
    });

    return response.data.result;
  }

  async getChatMemberCount(chatId) {
    const response = await axios.get(`${this.apiBase}/getChatMemberCount`, {
      params: { chat_id: chatId }
    });

    return response.data.result;
  }

  async getAnalytics() {
    const botInfo = await axios.get(`${this.apiBase}/getMe`);

    return {
      botId: botInfo.data.result.id,
      botUsername: botInfo.data.result.username,
      botName: botInfo.data.result.first_name
    };
  }

  async sendPoll(chatId, question, options, isAnonymous = true) {
    const response = await axios.post(`${this.apiBase}/sendPoll`, {
      chat_id: chatId,
      question,
      options,
      is_anonymous: isAnonymous
    });

    return response.data;
  }

  async pinMessage(chatId, messageId) {
    await axios.post(`${this.apiBase}/pinChatMessage`, {
      chat_id: chatId,
      message_id: messageId
    });

    return true;
  }
}

module.exports = TelegramService;
