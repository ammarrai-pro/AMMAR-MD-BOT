// commands/media/webzip.js
// Developer By Ammar Rai

const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'webzip',
  aliases: ['wzip', 'webtozip', 'saveweb'],
  category: 'media',
  description: 'Convert any website to ZIP file and send directly',
  usage: '.webzip <website-url>',

  async execute(sock, msg, args, extra) {
    try {
      // Check if URL provided
      if (!args.length) {
        return extra.reply(`❌ Please provide a website URL!\n\n📝 Usage: .webzip https://google.com\n\n👨‍💻 Developer By Ammar Rai`);
      }

      let targetUrl = args[0];
      
      // Add https:// if no protocol specified
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      // Send initial loading message
      await extra.react('⏳');
      const statusMsg = await extra.reply(`🔄 Processing...\n\n👨‍💻 Developer By Ammar Rai`);

      // Call the API to get download URL
      const apiUrl = `https://ammar-web-to-zip-api.vercel.app/zip?url=${encodeURIComponent(targetUrl)}`;
      
      const response = await axios.get(apiUrl, {
        timeout: 30000
      });

      // Check if API returned success
      if (!response.data || !response.data.success) {
        throw new Error('Conversion failed');
      }

      const result = response.data.result;
      const downloadUrl = result.download_url;
      const domain = result.domain;

      // Download the ZIP file
      const zipResponse = await axios({
        method: 'get',
        url: downloadUrl,
        responseType: 'stream',
        timeout: 60000
      });

      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Save ZIP file temporarily
      const tempFilePath = path.join(tempDir, `${domain}_${Date.now()}.zip`);
      const writer = fs.createWriteStream(tempFilePath);
      
      zipResponse.data.pipe(writer);

      // Wait for download to complete
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Get file size
      const stats = fs.statSync(tempFilePath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Delete the status message
      await sock.sendMessage(extra.from, { delete: statusMsg.key });

      // Send ONE message with ZIP file + all info + developer name
      await sock.sendMessage(extra.from, {
        document: fs.readFileSync(tempFilePath),
        mimetype: 'application/zip',
        fileName: `${domain}.zip`,
        caption: `✅ *Website Converted Successfully!*\n\n🌐 *Domain:* ${domain}\n📦 *File Size:* ${fileSizeInMB} MB\n⏱️ *Time Taken:* ${result.time_taken}\n\n📂 ZIP file contains the complete website.\n\n👨‍💻 *Developer By Ammar Rai*`
      }, { quoted: msg });

      // Delete temp file
      fs.unlinkSync(tempFilePath);
      
      await extra.react('✅');

    } catch (error) {
      console.error('WebZip Error:', error);
      
      let errorMessage = '❌ *Failed to convert website!*\n\n';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += '⏰ Timeout: Website took too long to respond.';
      } else if (error.response) {
        errorMessage += `📡 API Error: ${error.response.status}\nThe website might be inaccessible.`;
      } else if (error.request) {
        errorMessage += '🌐 Network Error: Cannot reach conversion service.';
      } else {
        errorMessage += `⚠️ Error: ${error.message}`;
      }
      
      errorMessage += `\n\n📝 Usage: .webzip https://example.com\n\n👨‍💻 Developer By Ammar Rai`;
      
      await extra.reply(errorMessage);
      await extra.react('❌');
      
      // Clean up temp file if it exists
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }
};
