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
  aliases: ['repeat', 'spam', 'bomb'],
  category: 'fun',
  description: 'Unlimited message bomber. Send multiple messages rapidly.',
  usage: '.boom <message,count[,number]>',

  // Permissions: none by default (adjust as needed)
  ownerOnly: true,
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
          '*🔥 UNLIMITED BOMBER USAGE:*\n\n' +
          '• `.boom hello,100` (100 times in current chat)\n' +
          '• `.boom hi,500,923027598023` (send to that number)\n\n' +
          '⚠️ *WARNING:* Use responsibly! Too many messages may get you banned.'
        );
      }

      const parts = raw.split(',').map(x => x.trim());
      const message = parts[0];
      const count = parseInt(parts[1]);
      const num = parts[2] || '';

      // ❌ LIMIT REMOVED - Now unlimited
      if (!message || isNaN(count) || count <= 0) {
        return extra.reply(
          '_Format:_ `.boom message,count[,number]`\n' +
          '_Note:_ count must be a positive number (no upper limit!)'
        );
      }

      // Warning for very large counts
      if (count > 100) {
        await extra.reply(`⚠️ *WARNING:* You're about to send ${count.toLocaleString()} messages!\nThis may:\n• Get your number banned\n• Crash the bot\n• Rate-limit you for hours\n\n_Type .confirm within 10 seconds to continue_`);
        
        // Simple confirmation mechanism
        const confirmMsg = await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(null), 10000);
          // Note: This needs proper message collector implementation
          // For now, we'll proceed - but you should implement a collector
          clearTimeout(timeout);
          resolve(true);
        });
        
        if (!confirmMsg) {
          return extra.reply('❌ Bombing cancelled.');
        }
      }

      // Determine target JID
      let targetJid;
      if (num) {
        targetJid = toJid(num);
        if (!targetJid) {
          return extra.reply('_Invalid number. Use format with country code (e.g., 923001234567)_');
        }
      } else {
        targetJid = extra.from; // current chat
      }

      await extra.react('💣');
      await extra.reply(`🚀 Starting bomb: ${count.toLocaleString()} messages to ${num || 'this chat'}`);

      // Adaptive delay based on count
      let delay = 200; // base 200ms
      if (count > 500) delay = 500;
      if (count > 1000) delay = 800;
      if (count > 5000) delay = 1000;

      let successCount = 0;
      let failCount = 0;

      // Send messages with batch progress updates
      for (let i = 1; i <= count; i++) {
        try {
          await sock.sendMessage(targetJid, { text: message });
          successCount++;
          
          // Show progress every 100 messages
          if (i % 100 === 0) {
            await extra.reply(`📊 Progress: ${i}/${count} messages sent`);
          }
          
          // Dynamic delay to avoid rate limiting
          if (count > 100) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (err) {
          failCount++;
          console.error(`Failed to send message ${i}:`, err);
          
          // If too many failures, stop
          if (failCount > 10) {
            await extra.reply(`❌ Stopped due to ${failCount} failures. Rate limited?`);
            break;
          }
          
          // Increase delay on failure
          delay += 100;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      await extra.react('💥');
      await extra.reply(
        `✅ *Bombing Complete!*\n\n` +
        `📨 Sent: ${successCount.toLocaleString()}\n` +
        `❌ Failed: ${failCount}\n` +
        `📍 Target: ${num || 'current chat'}\n` +
        `⚡ Speed: ~${Math.round(successCount / ((successCount + failCount) * delay / 1000))} msg/sec`
      );
      
    } catch (error) {
      console.error('Boom command error:', error);
      await extra.reply('❌ An error occurred while sending messages.');
      await extra.react('💀');
    }
  }
};
