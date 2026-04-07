const axios = require('axios');

module.exports = {
  name: 'namefinder',
  aliases: ['getname', 'whos', 'caller', 'findname', 'whonumber'],
  category: 'general',
  description: '🔍 Find name from any phone number',
  usage: '.namefinder <number>',
  
  async execute(sock, msg, args, extra) {
    // Check if number provided
    if (!args[0]) {
      return extra.reply(
        `🔍 *NAME FINDER* 🔍\n\n` +
        `📌 *.namefinder 03018787786*\n` +
        `📌 *.namefinder 923018787786*\n\n` +
        `✨ *Find anyone's name by number*`
      );
    }

    let number = args[0];
    
    // Clean the number - remove all non-digits
    number = number.replace(/\D/g, '');
    
    // If number starts with 0, replace with 92 (Pakistan)
    if (number.startsWith('0')) {
      number = '92' + number.substring(1);
    }
    
    // If number doesn't have country code, add 92
    if (number.length === 10 && !number.startsWith('92')) {
      number = '92' + number;
    }
    
    await extra.react('🔍');
    
    try {
      // Make API call
      const apiUrl = `https://ammar-all-international-number-sim.vercel.app/${number}`;
      console.log('Calling API:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('API Response:', JSON.stringify(response.data, null, 2));
      
      // Extract name from response
      let name = 'Unknown';
      
      // Check all possible fields in response
      if (response.data) {
        if (response.data.name) name = response.data.name;
        else if (response.data.developer) name = response.data.developer;
        else if (response.data.owner) name = response.data.owner;
        else if (response.data.caller_name) name = response.data.caller_name;
        else if (response.data.whatsapp) name = response.data.whatsapp;
        else if (typeof response.data === 'string') name = response.data;
        else {
          // If response is an object, try to get first string value
          const values = Object.values(response.data);
          for (const val of values) {
            if (typeof val === 'string' && val.length > 0) {
              name = val;
              break;
            }
          }
        }
      }
      
      // Send response
      await extra.reply(
        `👤 *NAME FOUND* 👤\n\n` +
        `📞 *Number:* +${number}\n` +
        `🏷️ *Name:* ${name}\n\n` +
        `✅ *Success!*`
      );
      
      await extra.react('✅');
      
    } catch (error) {
      console.error('Error details:', error.message);
      
      let errorMessage = `❌ *ERROR*\n\n`;
      errorMessage += `📞 *Number:* +${number}\n`;
      
      if (error.response) {
        errorMessage += `📡 *Status:* ${error.response.status}\n`;
        errorMessage += `💬 *Message:* ${error.response.data || 'No data'}`;
      } else if (error.request) {
        errorMessage += `🌐 *Error:* No response from server\n`;
        errorMessage += `🔌 *Check:* API might be down`;
      } else {
        errorMessage += `⚠️ *Error:* ${error.message}`;
      }
      
      errorMessage += `\n\n💡 *Try:* https://ammar-all-international-number-sim.vercel.app/${number}`;
      
      await extra.reply(errorMessage);
      await extra.react('❌');
    }
  }
};
