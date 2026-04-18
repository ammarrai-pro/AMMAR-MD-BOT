// commands/utility/smsbomber.js
// Developer By Ammar Rai

const axios = require('axios');

module.exports = {
  name: 'smsbomber',
  aliases: ['bomb', 'sms', 'bombsms', 'smsbomb'],
  category: 'utility',
  description: 'Send multiple SMS to a number (Use responsibly)',
  usage: '.smsbomber <number> <count>',

  async execute(sock, msg, args, extra) {
    try {
      // Check if number and count provided
      if (args.length < 2) {
        return extra.reply(`❌ Please provide number and count!

📝 Usage: .smsbomber 923001234567 10

📌 Example: .smsbomber 923018787786 5

⚠️ Use responsibly!

👨‍💻 Developer By Ammar Rai`);
      }

      let phoneNumber = args[0];
      let count = parseInt(args[1]);

      // Validate count
      if (isNaN(count) || count < 1 || count > 50) {
        return extra.reply(`❌ Invalid count!

Count must be between 1 and 50.

📝 Example: .smsbomber 923001234567 10

👨‍💻 Developer By Ammar Rai`);
      }

      // Clean phone number
      phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
      
      // Format number
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '92' + phoneNumber.substring(1);
      } else if (phoneNumber.startsWith('+92')) {
        phoneNumber = phoneNumber.substring(1);
      } else if (phoneNumber.length === 10) {
        phoneNumber = '92' + phoneNumber;
      }

      // Validate number length
      if (phoneNumber.length !== 12 || !phoneNumber.startsWith('92')) {
        return extra.reply(`❌ Invalid phone number!

Use format: 923001234567 (12 digits starting with 92)

👨‍💻 Developer By Ammar Rai`);
      }

      // Show loading
      await extra.react('⏳');
      const statusMsg = await extra.reply(`📱 Sending ${count} SMS to ${phoneNumber}...\n⏱️ Please wait.`);

      // Call API with increased timeout
      const apiUrl = `https://rai-ammar-sms-bomber-api.vercel.app/?number=${phoneNumber}&count=${count}`;
      
      const response = await axios.get(apiUrl, {
        timeout: 60000, // Increased to 60 seconds
        headers: {
          'User-Agent': 'ProBoy-MD-Bot/1.0'
        }
      });

      // Delete status message
      await sock.sendMessage(extra.from, { delete: statusMsg.key });

      // Check response
      if (!response.data || response.data.Target_Details.Status !== 'Success') {
        throw new Error('API request failed');
      }

      const target = response.data.Target_Details;
      const stats = response.data.Bombing_Stats;
      const developer = response.data.Developer_Credits;
      const time = response.data.Timestamp;

      // Success message
      const resultMessage = `✅ SMS BOMBING COMPLETED

📞 Target: ${target.Input_Number}
📊 Requested: ${stats.Total_Count_Requested}
✅ Sent: ${stats.Successfully_Sent}
⏰ Time: ${time}

🏷️ Brand: ${developer.Brand}

⚠️ Use responsibly!

👨‍💻 Developer By Ammar Rai`;

      await extra.reply(resultMessage);
      await extra.react('✅');

    } catch (error) {
      console.error('SMS Bomber Error:', error);
      
      let errorMsg = '';
      
      if (error.code === 'ECONNABORTED') {
        errorMsg = 'Server is busy! Try with smaller count (5-10 SMS).';
      } else if (error.response) {
        errorMsg = 'API error! Please try again.';
      } else if (error.request) {
        errorMsg = 'Network error! Check your connection.';
      } else {
        errorMsg = error.message || 'Unknown error! Try again.';
      }
      
      const errorMessage = `❌ SMS BOMBING FAILED

⚠️ ${errorMsg}

💡 Tip: Try with fewer SMS (5-10) or wait a few minutes.

📝 Usage: .smsbomber 923001234567 10

👨‍💻 Developer By Ammar Rai`;
      
      await extra.reply(errorMessage);
      await extra.react('❌');
    }
  }
};
