// commands/fun/boom.js
const config = require('../../config');

/**
 * Normalize phone number: remove non-digits
 */
function normalizeNumber(num) {
  return String(num || '').replace(/[^0-9]/g, '');
}

/**
 * Convert normalized number to JID
 */
function toJid(num) {
  const n = normalizeNumber(num);
  return n ? `${n}@s.whatsapp.net` : null;
}

module.exports = {
  name: 'boom',
  aliases: ['bomb', 'spam', 'blast'],
  category: 'fun',
  description: 'Unlimited Message Bomber',
  usage: '.boom <message,count> or .boom <message,count,number>',

  ownerOnly: false,
  modOnly: false,
  groupOnly: false,
  privateOnly: false,
  adminOnly: false,
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      // DEBUG: Log to console
      console.log('=== BOOM COMMAND TRIGGERED ===');
      console.log('Raw args:', args);
      console.log('Is Group:', extra.isGroup);
      console.log('From:', extra.from);
      
      const raw = args.join(' ').trim();
      
      // DEBUG: Show what user typed
      if (!raw) {
        return extra.reply(
          '*💣 MESSAGE BOMBER*\n\n' +
          '• `.boom Hello,10` (send in this chat)\n' +
          '• `.boom Hi,50,923001234567` (send to number)\n\n' +
          '_Make sure to use COMMA (,) not space_\n' +
          `_You typed: ${raw || 'nothing'}_`
        );
      }

      // Parse with better logic
      let message, count, targetNumber;
      
      // Try to parse: message,count,number
      const commaParts = raw.split(',').map(x => x.trim());
      
      if (commaParts.length >= 2) {
        message = commaParts[0];
        count = parseInt(commaParts[1]);
        targetNumber = commaParts[2] || '';
      } else {
        // If no comma, try to split by space for backward compatibility
        const spaceParts = raw.split(' ');
        if (spaceParts.length >= 2) {
          message = spaceParts[0];
          count = parseInt(spaceParts[1]);
          targetNumber = spaceParts[2] || '';
        } else {
          return extra.reply('❌ Use format: `.boom message,count` or `.boom message count`');
        }
      }
      
      // Validation
      if (!message || isNaN(count) || count <= 0) {
        return extra.reply(
          '❌ *Invalid format!*\n\n' +
          '✅ Correct formats:\n' +
          '• `.boom Hello,10`\n' +
          '• `.boom Hi,50,923001234567`\n\n' +
          `📝 You typed: ${raw}\n` +
          `📊 Message: ${message || 'missing'}\n` +
          `🔢 Count: ${count || 'missing'}`
        );
      }
      
      // Limit count for safety (remove this if you want unlimited)
      const MAX_COUNT = 500; // Set to 500 for safety in groups
      if (count > MAX_COUNT) {
        return extra.reply(`⚠️ Max ${MAX_COUNT} messages allowed for safety. You requested ${count}.`);
      }
      
      // Determine target
      let targetJid;
      let targetDisplay;
      
      if (targetNumber) {
        const cleanTarget = normalizeNumber(targetNumber);
        if (!cleanTarget || cleanTarget.length < 10) {
          return extra.reply('❌ Invalid number! Use: 923001234567');
        }
        targetJid = toJid(cleanTarget);
        targetDisplay = cleanTarget;
      } else {
        targetJid = extra.from;
        targetDisplay = extra.isGroup ? 'this group' : 'this chat';
      }
      
      // Send confirmation
      await extra.reply(
        `🚀 *Bomb Started*\n\n` +
        `📝 Message: ${message}\n` +
        `🔢 Count: ${count}\n` +
        `📍 Target: ${targetDisplay}\n` +
        `⏱️ This will take ~${Math.ceil(count * 0.3)} seconds\n\n` +
        `_Sending..._`
      );
      
      // Send messages
      let successCount = 0;
      let failCount = 0;
      const delay = 300; // 300ms delay
      
      for (let i = 1; i <= count; i++) {
        try {
          await sock.sendMessage(targetJid, { text: message });
          successCount++;
          
          // Show progress every 10 messages (more frequent for groups)
          if (i % 10 === 0 && i < count) {
            await extra.reply(`📊 Progress: ${i}/${count} sent`);
          }
          
          // Delay
          if (count > 10) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (err) {
          failCount++;
          console.error(`Failed: ${i}`, err);
          if (failCount > 5) {
            await extra.reply(`❌ Stopped: Too many failures. Rate limited?`);
            break;
          }
        }
      }
      
      // Final report
      await extra.reply(
        `✅ *Bomb Complete!*\n\n` +
        `✅ Sent: ${successCount}\n` +
        `❌ Failed: ${failCount}\n` +
        `📍 Target: ${targetDisplay}`
      );
      
    } catch (error) {
      console.error('Boom Error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};
