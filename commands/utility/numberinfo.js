// commands/utility/numberinfo.js
// Developer By Ammar Rai

const axios = require('axios');

module.exports = {
  name: 'numberinfo',
  aliases: ['numinfo', 'siminfo', 'numberdata', 'whonumber', 'phonedata'],
  category: 'utility',
  description: 'Get information about any phone number',
  usage: '.numberinfo <phone-number>',

  async execute(sock, msg, args, extra) {
    try {
      // Check if number provided
      if (!args.length) {
        return extra.reply(`❌ *Please provide a phone number!*\n\n📝 *Usage:* .numberinfo 923018787786\n\n📌 *Example:* .numberinfo 923001234567\n\n👨‍💻 *Developer By Ammar Rai*`);
      }

      let phoneNumber = args[0];
      
      // Clean the phone number (remove +, spaces, etc.)
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
      
      // Remove country code if 92 or keep as is
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '92' + phoneNumber.substring(1);
      } else if (phoneNumber.startsWith('92')) {
        phoneNumber = phoneNumber;
      } else if (phoneNumber.startsWith('+92')) {
        phoneNumber = phoneNumber.substring(1);
      } else if (phoneNumber.length === 10) {
        phoneNumber = '92' + phoneNumber;
      }

      // Validate number length (should be 12 digits with country code)
      if (phoneNumber.length < 10 || phoneNumber.length > 15) {
        return extra.reply(`❌ *Invalid phone number!*\n\nPlease enter a valid number.\n\n📝 *Example:* 923001234567\n\n👨‍💻 *Developer By Ammar Rai*`);
      }

      // Show loading reaction
      await extra.react('⏳');

      // Call the API
      const apiUrl = `https://ammar-all-international-number-sim.vercel.app/${phoneNumber}`;
      
      const response = await axios.get(apiUrl, {
        timeout: 15000
      });

      // Check if API returned success
      if (!response.data || !response.data.SYSTEM_LOG || response.data.SYSTEM_LOG.status !== 'Success') {
        throw new Error('Number not found or API error');
      }

      const developer = response.data.DEVELOPER_DETAILS;
      const result = response.data.SEARCH_RESULT;
      const system = response.data.SYSTEM_LOG;

      // Format the response message
      const infoMessage = `╭━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 📱 *NUMBER INFORMATION* 📱
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

👤 *Full Name:* ${result.full_name || 'N/A'}
📞 *Phone Number:* ${result.phone_number || phoneNumber}
🆔 *Facebook ID:* ${result.facebook_id || 'N/A'}
🖼️ *Profile Image:* ${result.profile_img || 'Not Available'}

╭━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 📊 *SEARCH DETAILS*
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

🔍 *Search Query:* ${system.formatted_input || phoneNumber}
✅ *Status:* ${system.status || 'Success'}

╭━━━━━━━━━━━━━━━━━━━━━━━━╮
┃ 👨‍💻 *DEVELOPER INFO*
╰━━━━━━━━━━━━━━━━━━━━━━━━╯

👨‍💻 *Name:* ${developer.name || 'Ammar Rai'}
💬 *WhatsApp:* ${developer.whatsapp || '923018787786'}
🏷️ *Status:* ${developer.status || 'Official API'}

━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💻 *Developer By Ammar Rai*`;

      // Send the information
      await extra.reply(infoMessage);
      await extra.react('✅');

    } catch (error) {
      console.error('Number Info Error:', error);
      
      let errorMessage = '❌ *Failed to get number information!*\n\n';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage += '⏰ Timeout: Server took too long to respond.\nPlease try again.';
      } else if (error.response) {
        errorMessage += `📡 API Error: ${error.response.status}\nNumber not found in database.`;
      } else if (error.request) {
        errorMessage += '🌐 Network Error: Cannot reach server.\nCheck your internet connection.';
      } else {
        errorMessage += `⚠️ Error: ${error.message}`;
      }
      
      errorMessage += `\n\n📝 *Usage:* .numberinfo 923001234567\n\n📌 *Example:* .numberinfo 923018787786\n\n👨‍💻 *Developer By Ammar Rai*`;
      
      await extra.reply(errorMessage);
      await extra.react('❌');
    }
  }
};
