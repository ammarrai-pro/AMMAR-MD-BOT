// commands/media/tiktokprofile.js
// Developer By Ammar Rai

const axios = require('axios');

module.exports = {
  name: 'tiktokprofile',
  aliases: ['ttprofile', 'ttuser', 'tiktokuser', 'ttinfo'],
  category: 'media',
  description: 'Get TikTok profile information',
  usage: '.tiktokprofile <username>',

  async execute(sock, msg, args, extra) {
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

      // Simple design with developer name
      const profileMessage = `📱 TIKTOK PROFILE

👤 USER INFO
   📛 Name: ${user.display_name || 'N/A'}
   🔖 Username: @${user.username}
   📝 Bio: ${user.bio || 'No bio'}

📊 STATISTICS
   👥 Followers: ${followers}
   📌 Following: ${following}
   ❤️ Likes: ${likes}
   🎬 Videos: ${videos}

👨‍💻 DEVELOPER: ${developer || 'AMMAR-RAI TECH™'}

👨‍💻 Developer By Ammar Rai`;

      // Send the information
      await extra.reply(profileMessage);
      await extra.react('✅');

    } catch (error) {
      console.error('TikTok Profile Error:', error);
      
      const errorMessage = `❌ ERROR

⚠️ ${error.response ? 'Username not found!' : error.code === 'ECONNABORTED' ? 'Server timeout! Please try again.' : 'Network error! Check your connection.'}

📝 Usage: .tiktokprofile username

👨‍💻 Developer By Ammar Rai`;
      
      await extra.reply(errorMessage);
      await extra.react('❌');
    }
  }
};
