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
    
    try {
      // Call your API
      const response = await axios.get(`https://ammar-all-international-number-sim.vercel.app/${number}`, {
        timeout: 10000
      });
      
      // Extract name
      const name = response.data.name || 
                   response.data.caller_name || 
                   response.data.owner || 
                   response.data.developer ||
                   'Unknown User';
      
      // Stylish output
      const result = 
`👤 *NAME FOUND* 👤

━━━━━━━━━━━━━━━━━━━━━━
📞 *Number:* +${number}
🏷️ *Name:* ${name}
━━━━━━━━━━━━━━━━━━━━━━

✅ *Successfully retrieved!*`;
      
      await extra.reply(result);
      await extra.react('✅');
      
    } catch (error) {
      // Error handling
      const errorMsg = 
`❌ *NOT FOUND* ❌

━━━━━━━━━━━━━━━━━━━━━━
📞 *Number:* +${number}
⚠️ *Status:* No record found
━━━━━━━━━━━━━━━━━━━━━━

💡 *Tips:*
• Check number spelling
• Use international format
• Try with country code`;
      
      await extra.reply(errorMsg);
      await extra.react('❌');
    }
  }
};
