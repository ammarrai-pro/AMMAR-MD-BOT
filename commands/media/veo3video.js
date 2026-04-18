// commands/media/veo3video.js
// Developer By Ammar Rai

const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'veo3',
  aliases: ['text2video', 't2v', 'generatevideo', 'aivideo'],
  category: 'media',
  description: 'Convert text to video using Veo3 AI (Fast)',
  usage: '.veo3 <your text description>',

  async execute(sock, msg, args, extra) {
    let tempFilePath = null; // Define variable outside try block
    
    try {
      // Check if text provided
      if (!args.length) {
        return extra.reply(`❌ *Please provide text description!*\n\n📝 *Usage:* .veo3 a beautiful sunset on beach\n\n🎬 *Example:* .veo3 A cat playing with yarn\n\n👨‍💻 *Developer By Ammar Rai*`);
      }

      const prompt = args.join(' ');
      
      // Show loading reaction
      await extra.react('⏳');

      // Call the API to generate video (Fast timeout)
      const apiUrl = `https://ammar-veo3-text-to-video-api.vercel.app/gen?prompt=${encodeURIComponent(prompt)}`;
      
      const response = await axios.get(apiUrl, {
        timeout: 30000 // 30 seconds timeout for fast generation
      });

      // Check if API returned success
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Video generation failed');
      }

      const result = response.data.result;
      const videoUrl = result.video_url || result.url || result.download_url;
      
      if (!videoUrl) {
        throw new Error('No video URL received from API');
      }

      // Download the video
      const videoResponse = await axios({
        method: 'get',
        url: videoUrl,
        responseType: 'stream',
        timeout: 30000 // 30 seconds download timeout
      });

      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Save video temporarily
      const videoId = Date.now();
      tempFilePath = path.join(tempDir, `veo3_${videoId}.mp4`);
      const writer = fs.createWriteStream(tempFilePath);
      
      videoResponse.data.pipe(writer);

      // Wait for download to complete
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Check if file exists and has content
      if (!fs.existsSync(tempFilePath)) {
        throw new Error('Video file not saved properly');
      }

      // Get file size
      const stats = fs.statSync(tempFilePath);
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

      // Send ONE message with video + all info + developer name
      await sock.sendMessage(extra.from, {
        video: fs.readFileSync(tempFilePath),
        mimetype: 'video/mp4',
        caption: `✅ *Video Generated Successfully!*\n\n🎬 *Prompt:* ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}\n📦 *Size:* ${fileSizeInMB} MB\n\n🎥 *Veo3 AI Generated Video*\n\n👨‍💻 *Developer By Ammar Rai*`
      }, { quoted: msg });

      await extra.react('✅');

    } catch (error) {
      console.error('Veo3 Video Error:', error);
      
      let errorMessage = '❌ *Failed to generate video!*\n\n';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += '⏰ Server is busy. Please try again in a few seconds.\n\n💡 *Tip:* Try shorter text like:\n.veo3 cat playing';
      } else if (error.response) {
        errorMessage += `📡 API Error: ${error.response.status}\nThe server might be busy. Try again.`;
      } else if (error.request) {
        errorMessage += '🌐 Network Error: Cannot reach generation service.\nCheck your internet connection.';
      } else {
        errorMessage += `⚠️ Error: ${error.message}`;
      }
      
      errorMessage += `\n\n📝 *Usage:* .veo3 beautiful sunset\n\n👨‍💻 *Developer By Ammar Rai*`;
      
      await extra.reply(errorMessage);
      await extra.react('❌');
      
    } finally {
      // Clean up temp file if it exists (FIXED: tempFilePath defined now)
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (cleanupError) {
          console.error('Cleanup error:', cleanupError);
        }
      }
    }
  }
};
