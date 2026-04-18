// commands/media/webzip.js
const axios = require('axios');

module.exports = {
  name: 'webzip',
  aliases: ['wzip', 'webtozip', 'saveweb'],
  category: 'media',
  description: 'Convert any website to ZIP file',
  usage: '.webzip <website-url>',

  async execute(sock, msg, args, extra) {
    try {
      // Check if URL provided
      if (!args.length) {
        return extra.reply(`❌ Please provide a website URL!\n\n📝 Usage: .webzip https://google.com`);
      }

      let targetUrl = args[0];
      
      // Add https:// if no protocol specified
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      // Send processing message
      await extra.react('⏳');
      await extra.reply(`🔄 Converting website to ZIP...\n\n🌐 URL: ${targetUrl}\n⏱️ Please wait.`);

      // Call the API
      const apiUrl = `https://ammar-web-to-zip-api.vercel.app/zip?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await axios.get(apiUrl, {
        timeout: 30000
      });

      // Check if API returned success
      if (!response.data || !response.data.success) {
        throw new Error('Conversion failed');
      }

      const result = response.data.result;

      // Send success message with download link
      const successMessage = `✅ *Website Converted Successfully!*\n\n` +
        `🌐 *Domain:* ${result.domain}\n` +
        `⏱️ *Time Taken:* ${result.time_taken}\n\n` +
        `📥 *Download ZIP:*\n${result.download_url}\n\n` +
        `💡 Click the link above to download your ZIP file.`;

      await extra.reply(successMessage);
      await extra.react('✅');

    } catch (error) {
      console.error('WebZip Error:', error);
      
      let errorMessage = '❌ *Failed to convert website!*\n\n';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += '⏰ Timeout: Website took too long.';
      } else if (error.response) {
        errorMessage += `📡 API Error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage += '🌐 Network Error: Cannot reach service.';
      } else {
        errorMessage += `⚠️ Error: ${error.message}`;
      }
      
      errorMessage += `\n\n📝 Usage: .webzip https://example.com`;
      
      await extra.reply(errorMessage);
      await extra.react('❌');
    }
  }
};
