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
  description: 'Unlimited message bomber - Send multiple messages rapidly (Owner Only)',
  usage: '.boom <message,count[,number]>',

  // 🔒 SIRF OWNER USE KAR SAKTA HAI
  ownerOnly: true,      // ✅ Sirf owner
  modOnly: false,       // ❌ Mods nahi kar sakte
  groupOnly: false,     // ✅ Group mein bhi work karega
  privateOnly: false,   // ✅ Private mein bhi work karega
  adminOnly: false,     // ❌ Group admin hone se nahi chalega (sirf owner)
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      // 🔒 EXTRA SECURITY: Check again if owner
      const ownerNumber = config.ownerNumber || config.OWNER_NUMBER;
      const senderNumber = msg.key.remoteJid?.split('@')[0] || msg.pushName;
      
      // Agar owner nahi hai to block karo
      if (ownerNumber && !ownerNumber.includes(senderNumber)) {
        await extra.reply('❌ *Access Denied!*\n\nThis command can only be used by the BOT OWNER.');
        return;
      }
      
      const raw = args.join(' ').trim();
      if (!raw) {
        return extra.reply(
          '*💣 UNLIMITED BOMBER (OWNER ONLY)*\n\n' +
          '• `.boom hello,100` (100 times in current chat)\n' +
          '• `.boom hi,500,923027598023` (send to that number)\n' +
          '• `.boom test,50` (works in groups too!)\n\n' +
          '⚠️ *NO LIMIT - Use responsibly!*\n' +
          '🔒 *Owner Only Command*'
        );
      }

      const parts = raw.split(',').map(x => x.trim());
      const message = parts[0];
      const count = parseInt(parts[1]);
      const num = parts[2] || '';

      // Validation - NO UPPER LIMIT
      if (!message || isNaN(count) || count <= 0) {
        return extra.reply(
          '_Format:_ `.boom message,count[,number]`\n' +
          '_Note:_ count must be a positive number (no upper limit!)\n\n' +
          '_Example:_ `.boom Hello,100` or `.boom Hi,50,923001234567`'
        );
      }

      // Warning for very large counts
      if (count > 500) {
        await extra.reply(`⚠️ *WARNING Owner!*\n\nYou're about to send ${count.toLocaleString()} messages!\nThis may get you rate-limited.\n\n_Starting in 5 seconds..._`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Determine target JID
      let targetJid;
      let targetDisplay = num || (extra.isGroup ? 'this group' : 'this chat');
      
      if (num) {
        targetJid = toJid(num);
        if (!targetJid) {
          return extra.reply('_Invalid number. Use format with country code (e.g., 923001234567)_');
        }
      } else {
        targetJid = extra.from; // current chat (group or private)
      }

      await extra.react('💣');
      await extra.reply(`🚀 Starting bomb: ${count.toLocaleString()} messages to ${targetDisplay}`);

      // Adaptive delay based on count
      let delay = 200; // base 200ms
      if (count > 500) delay = 400;
      if (count > 1000) delay = 600;
      if (count > 5000) delay = 800;

      let successCount = 0;
      let failCount = 0;

      // Send messages
      for (let i = 1; i <= count; i++) {
        try {
          await sock.sendMessage(targetJid, { text: message });
          successCount++;
          
          // Show progress every 100 messages
          if (i % 100 === 0) {
            await extra.reply(`📊 Progress: ${i}/${count} messages sent`);
          }
          
          // Delay to avoid rate limits
          if (delay > 0 && count > 50) {
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
        `📍 Target: ${targetDisplay}\n` +
        `⚡ Speed: ~${Math.round(successCount / ((successCount + failCount) * delay / 1000)) || 1} msg/sec\n\n` +
        `🔒 Command used by: Owner`
      );
      
    } catch (error) {
      console.error('Boom command error:', error);
      await extra.reply('❌ An error occurred while sending messages.');
      await extra.react('❌');
    }
  }
};
