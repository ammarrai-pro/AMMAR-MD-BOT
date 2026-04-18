// commands/media/tiktokprofile.js
// Developer By Ammar Rai

const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'tiktokprofile',
  aliases: ['ttprofile', 'ttuser', 'tiktokuser', 'ttinfo'],
  category: 'media',
  description: 'Get TikTok profile information with image',
  usage: '.tiktokprofile <username>',

  async execute(sock, msg, args, extra) {
    let tempFilePath = null;
    
    try {
      // Check if username provided
      if (!args.length) {
        return extra.reply(`❌ Please provide a TikTok username!

📝 Usage: .tiktokprofile rai_ammar_kharal2

📌 Example: .tiktokprofile therock

👨‍💻 Developer By Ammar Rai`);
      }

      const username = args[0].toLowerCase().replace('@', '');
      
      // Show loading reaction
      await extra.react('⏳');

      // Call the API
      const apiUrl = `https://ammar-tiktok-profile-info-api.vercel.app/api?username=${encodeURIComponent(username)}`;
      
      const response = await axios.get(apiUrl, {
        timeout: 15000
      });

      // Check if API returned success
      if (!response.data || response.data.status !== 'success') {
        throw new Error('Username not found or API error');
      }

      const user = response.data.user_info;
      const stats = response.data.stats_database;
      const developer = response.data.developer;

      // Format numbers with commas
      const followers = stats.total_followers.toLocaleString();
      const following = stats.total_following.toLocaleString();
      const likes = stats.total_likes.toLocaleString();
      const videos = stats.total_videos.toLocaleString();

      // Download profile image
      const profilePicUrl = user.profile_pic;
      let imageBuffer = null;
      
      if (profilePicUrl && profilePicUrl !== 'N/A') {
        try {
          const imageResponse = await axios({
            method: 'get',
            url: profilePicUrl,
            responseType: 'arraybuffer',
            timeout: 10000
          });
          imageBuffer = Buffer.from(imageResponse.data);
        } catch (imgError) {
          console.error('Image download error:', imgError);
          // Continue without image
        }
      }

      // Create text message
      const profileText = `📱 TIKTOK PROFILE

👤 USER INFO
   📛 Name: ${user.display_name || 'N/A'}
   🔖 Username: @${user.username}
   📝 Bio: ${user.bio || 'No bio'}

📊 STATISTICS
   👥 Followers: ${followers}
   📌 Following: ${following}
   ❤️ Likes: ${likes}
   🎬 Videos: ${videos}

👨‍💻 DEVELOPER: ${developer || 'AMMAR-RAI TECH™'}`;

      // Send image first if available, then text
      if (imageBuffer) {
        // Send profile image
        await sock.sendMessage(extra.from, {
          image: imageBuffer,
          caption: profileText
        }, { quoted: msg });
      } else {
        // Send only text if no image
        await extra.reply(profileText);
      }
      
      await extra.react('✅');

    } catch (error) {
      console.error('TikTok Profile Error:', error);
      
      const errorMessage = `❌ ERROR

⚠️ ${error.response ? 'Username not found!' : error.code === 'ECONNABORTED' ? 'Server timeout! Please try again.' : 'Network error! Check your connection.'}

📝 Usage: .tiktokprofile username

👨‍💻 Developer By Ammar Rai`;
      
      await extra.reply(errorMessage);
      await extra.react('❌');
      
    } finally {
      // Clean up temp file if exists
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
