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
      const name = (result.full_name || 'N/A').trim();
      const number = result.phone_number || phoneNumber;

      // Auto box design function
      function makeBox(title, content) {
        const boxWidth = 23;
        const topLine = '┌' + '─'.repeat(boxWidth) + '┐';
        const titleLine = '│  ' + title + ' '.repeat(boxWidth - title.length - 2) + '│';
        const midLine = '├' + '─'.repeat(boxWidth) + '┤';
        const contentLine = '│  ' + content + ' '.repeat(boxWidth - content.length - 2) + '│';
        const bottomLine = '└' + '─'.repeat(boxWidth) + '┘';
        return `${topLine}\n${titleLine}\n${midLine}\n${contentLine}\n${bottomLine}`;
      }

      // Auto adjust based on name length
      const nameDisplay = name.length > 19 ? name.substring(0, 16) + '...' : name;
      const numberDisplay = number.length > 19 ? number : number;

      // Fixed box design (properly aligned)
      const infoMessage = `┌─────────────────────┐
│  📱 SIM DATABASE    │
└─────────────────────┘

┌─────────────────────┐
│  👤 OWNER NAME      │
│  ${nameDisplay.padEnd(19)}│
├─────────────────────┤
│  📞 PHONE NUMBER    │
│  ${numberDisplay.padEnd(19)}│
└─────────────────────┘

┌─────────────────────┐
│  👨‍💻 DEVELOPER     │
│  AMMAR RAI          │
└─────────────────────┘`;

      // Send the information
      await extra.reply(infoMessage);
      await extra.react('✅');

    } catch (error) {
      console.error('Number Info Error:', error);
      
      const errorMessage = `┌─────────────────────┐
│  ❌ ERROR          │
└─────────────────────┘

┌─────────────────────┐
│  ⚠️ ${error.response ? 'NUMBER NOT FOUND' : error.code === 'ECONNABORTED' ? 'SERVER TIMEOUT' : 'NETWORK ERROR'.padEnd(19)} │
└─────────────────────┘

┌─────────────────────┐
│  📝 .numberinfo    │
│  923001234567      │
└─────────────────────┘

👨‍💻 Developer By Ammar Rai`;
      
      await extra.reply(errorMessage);
      await extra.react('❌');
    }
  }
};
