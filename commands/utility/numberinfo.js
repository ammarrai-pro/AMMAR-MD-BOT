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
        return extra.reply(`❌ Please provide a phone number!

📝 Usage: .numberinfo 923018787786

📌 Example: .numberinfo 923001234567

👨‍💻 Developer By Ammar Rai`);
      }

      let phoneNumber = args[0];
      
      // Clean the phone number (remove +, spaces, etc.)
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
      
      // Format the number
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '92' + phoneNumber.substring(1);
      } else if (phoneNumber.startsWith('92')) {
        phoneNumber = phoneNumber;
      } else if (phoneNumber.startsWith('+92')) {
        phoneNumber = phoneNumber.substring(1);
      } else if (phoneNumber.length === 10) {
        phoneNumber = '92' + phoneNumber;
      }

      // Validate number length
      if (phoneNumber.length < 10 || phoneNumber.length > 15) {
        return extra.reply(`❌ Invalid phone number!

Please enter a valid number.

📝 Example: 923001234567

👨‍💻 Developer By Ammar Rai`);
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

      const result = response.data.SEARCH_RESULT;
      const name = result.full_name || 'N/A';
      const number = result.phone_number || phoneNumber;

      // Auto-adjust lines for WhatsApp
      const infoMessage = `📱 NUMBER INFORMATION

━━━━━━━━━━━━━━━━━━━━━━━━

👤 NAME: ${name}

📞 NUMBER: ${number}

━━━━━━━━━━━━━━━━━━━━━━━━

👨‍💻 DEVELOPER BY AMMAR RAI`;

      // Send the information
      await extra.reply(infoMessage);
      await extra.react('✅');

    } catch (error) {
      console.error('Number Info Error:', error);
      
      const errorMessage = `❌ FAILED TO GET NUMBER INFO

━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ ${error.response ? 'Number not found in database.' : error.code === 'ECONNABORTED' ? 'Server timeout. Please try again.' : 'Network error. Check your connection.'}

━━━━━━━━━━━━━━━━━━━━━━━━

📝 Usage: .numberinfo 923001234567

👨‍💻 DEVELOPER BY AMMAR RAI`;
      
      await extra.reply(errorMessage);
      await extra.react('❌');
    }
  }
};
