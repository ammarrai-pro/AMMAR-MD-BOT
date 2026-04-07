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
  aliases: ['bomb', 'spam', 'anonymous', 'blast'],
  category: 'fun',
  description: 'Unlimited Message Bomber - Send multiple messages rapidly (Everyone can use)',
  usage: '.boom <message,count[,number]>',

  // 🌍 EVERYONE CAN USE - No restrictions
  ownerOnly: false,
  modOnly: false,
  groupOnly: false,
  privateOnly: false,
  adminOnly: false,
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      const raw = args.join(' ').trim();
      if (!raw) {
        return extra.reply(
          '*💣 UNLIMITED MESSAGE BOMBER (PUBLIC)*\n\n' +
          '✨ *Everyone can use this command!*\n\n' +
          '*Usage:*\n' +
          '• `.boom Hello,100` (send to current chat)\n' +
          '• `.boom Hi,50,923001234567` (send to any number)\n' +
          '• `.boom Hey,200` (send to current group)\n\n' +
          '*Features:*\n' +
          '✅ Unlimited messages (no limit)\n' +
          '✅ Works in groups & private chats\n' +
          '✅ Send to any WhatsApp number\n' +
          '✅ Auto delay to avoid ban\n\n' +
          '⚠️ *Use responsibly!*'
        );
      }

      const parts = raw.split(',').map(x => x.trim());
      const message = parts[0];
      const count = parseInt(parts[1]);
      const targetNumber = parts[2] || '';
      
      // Validation
      if (!message || isNaN(count) || count <= 0) {
        return extra.reply(
          '❌ *Wrong format!*\n\n' +
          '• Current chat: `.boom Hello,50`\n' +
          '• Specific number: `.boom Hello,50,923001234567`\n\n' +
          'Count must be a positive number (no limit!)'
        );
      }
      
      // Limit warning for very high counts (optional, not a hard limit)
      if (count > 1000) {
        await extra.reply(
          `⚠️ *WARNING!*\n\n` +
          `You're about to send ${count.toLocaleString()} messages!\n` +
          `This may get you rate-limited by WhatsApp.\n\n` +
          `_Starting in 3 seconds..._`
        );
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Determine target
      let targetJid;
      let targetDisplay;
      const isGroup = extra.isGroup || false;
      
      if (targetNumber) {
        // Send to specific number
        const cleanTarget = normalizeNumber(targetNumber);
        if (!cleanTarget || cleanTarget.length < 10) {
          return extra.reply('❌ Invalid number! Use: 923001234567 (with country code)');
        }
        targetJid = toJid(cleanTarget);
        targetDisplay = cleanTarget;
      } else {
        // Send to current chat
        targetJid = extra.from;
        if (isGroup) {
          targetDisplay = 'this group';
        } else {
          targetDisplay = 'this chat';
        }
      }
      
      // Show starting message
      await extra.react('💣');
      await extra.reply(
        `🚀 *Starting Bomb*\n\n` +
        `📨 Messages: ${count.toLocaleString()}\n` +
        `📍 Target: ${targetDisplay}\n` +
        `👤 Requester: ${msg.pushName || 'User'}\n\n` +
        `_Sending..._`
      );
      
      // Adaptive delay based on count
      let delay = 200; // 200ms base
      if (count > 500) delay = 300;
      if (count > 1000) delay = 500;
      if (count > 5000) delay = 800;
      
      let successCount = 0;
      let failCount = 0;
      
      // Send messages
      for (let i = 1; i <= count; i++) {
        try {
          await sock.sendMessage(targetJid, { 
            text: message
          });
          successCount++;
          
          // Show progress every 100 messages
          if (i % 100 === 0 && i < count) {
            await extra.reply(`📊 Progress: ${i}/${count} messages sent`);
          }
          
          // Add delay to avoid rate limiting
          if (delay > 0 && count > 50) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (err) {
          failCount++;
          console.error(`Failed message ${i}:`, err);
          
          // Stop if too many failures
          if (failCount > 10) {
            await extra.reply(`❌ Stopped due to ${failCount} failures. Rate limited?`);
            break;
          }
          
          // Increase delay on failure
          delay += 100;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Final report
      await extra.react('💥');
      await extra.reply(
        `✅ *Bomb Complete!*\n\n` +
        `📍 Target: ${targetDisplay}\n` +
        `📨 Sent: ${successCount.toLocaleString()}\n` +
        `❌ Failed: ${failCount}\n` +
        `📝 Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}\n` +
        `⚡ Speed: ~${Math.round(successCount / ((successCount + failCount) * delay / 1000)) || 1} msg/sec\n\n` +
        `👤 Sent by: ${msg.pushName || 'User'}`
      );
      
    } catch (error) {
      console.error('Boom command error:', error);
      await extra.reply('❌ An error occurred while sending messages.');
      await extra.react('❌');
    }
  }
};
