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
      const helpMsg = 
`🔍 *NAME FINDER* 🔍

━━━━━━━━━━━━━━━━━━━━━━
📌 *Command:* .namefinder <number>
📌 *Example:* .namefinder 03018787786
📌 *Example:* .namefinder +923018787786
━━━━━━━━━━━━━━━━━━━━━━

✨ *Features:*
• 🇵🇰 Pakistani numbers
• 🌍 International numbers
• ⚡ Fast response
• 🎯 Accurate results

💫 *Try it now!*`;
      
      return extra.reply(helpMsg);
    }

    let number = args[0];
    
    // Clean the number
    number = number.replace(/[^0-9]/g, '');
    
    // Remove leading 0 if present (for Pakistani numbers)
    if (number.startsWith('0')) {
      number = '92' + number.substring(1);
    }
    
    // Show searching animation
    await extra.react('🔍');
    await extra.reply(`🔍 *Searching for +${number}...*`);
    
    try {
      // Call your API
      const response = await axios.get(`https://ammar-all-international-number-sim.vercel.app/${number}`, {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Ammar-MD-Bot'
        }
      });
      
      // Debug: Log the response to see what API returns
      console.log('API Response:', response.data);
      
      // Extract name - Check all possible fields
      let name = 'Unknown';
      
      if (response.data) {
        // Try different possible field names
        if (response.data.name) name = response.data.name;
        else if (response.data.caller_name) name = response.data.caller_name;
        else if (response.data.owner) name = response.data.owner;
        else if (response.data.developer) name = response.data.developer;
        else if (response.data.username) name = response.data.username;
        else if (response.data.title) name = response.data.title;
        else if (typeof response.data === 'string') name = response.data;
        else if (response.data.result && response.data.result.name) name = response.data.result.name;
        else if (response.data.data && response.data.data.name) name = response.data.data.name;
        
        // If still unknown, show the whole response for debugging
        if (name === 'Unknown') {
          console.log('Full API Response:', JSON.stringify(response.data, null, 2));
          // Try to get any string value from response
          const firstValue = Object.values(response.data)[0];
          if (firstValue && typeof firstValue === 'string') {
            name = firstValue;
          }
        }
      }
      
      // Stylish output with full data
      const result = 
`👤 *NAME FOUND* 👤

━━━━━━━━━━━━━━━━━━━━━━
📞 *Number:* +${number}
🏷️ *Name:* ${name}
━━━━━━━━━━━━━━━━━━━━━━

📊 *Full API Response:*
${JSON.stringify(response.data, null, 2)}

✅ *Successfully retrieved!*`;
      
      await extra.reply(result);
      await extra.react('✅');
      
    } catch (error) {
      console.error('API Error:', error.message);
      
      let errorDetails = '';
      if (error.response) {
        errorDetails = `\n📡 *API Status:* ${error.response.status}\n📄 *Response:* ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorDetails = `\n🌐 *No response from API server*`;
      } else {
        errorDetails = `\n⚠️ *Error:* ${error.message}`;
      }
      
      const errorMsg = 
`❌ *API ERROR* ❌

━━━━━━━━━━━━━━━━━━━━━━
📞 *Number:* +${number}
⚠️ *Status:* Failed to fetch data
${errorDetails}
━━━━━━━━━━━━━━━━━━━━━━

💡 *Tips:*
• Check if API is working
• Try visiting: https://ammar-all-international-number-sim.vercel.app/${number}
• Contact API developer: Ammar Rai (923018787786)`;
      
      await extra.reply(errorMsg);
      await extra.react('❌');
    }
  }
};
