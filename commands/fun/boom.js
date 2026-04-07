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
  aliases: ['bomb', 'spam', 'anonymous'],
  category: 'fun',
  description: 'Anonymous Unlimited Bomber - Send messages without revealing sender',
  usage: '.boom <message,count,number>',

  // 🔒 SIRF OWNER
  ownerOnly: true,
  modOnly: false,
  groupOnly: false,
  privateOnly: false,
  adminOnly: false,
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      // Owner verification
      const ownerNumber = config.ownerNumber || config.OWNER_NUMBER;
      const senderNumber = msg.key.remoteJid?.split('@')[0] || msg.pushName;
      
      if (ownerNumber && !ownerNumber.includes(senderNumber)) {
        await extra.reply('❌ *Access Denied!*\n\nOnly bot owner can use this command.');
        return;
      }
      
      const raw = args.join(' ').trim();
      if (!raw) {
        return extra.reply(
          '*💣 ANONYMOUS UNLIMITED BOMBER (Owner Only)*\n\n' +
          '• `.boom Hello,100,923001234567`\n' +
          '• `.boom Hi,500,923162563671`\n\n' +
          '✨ *Features:*\n' +
          '• Target will NOT know who sent\n' +
          '• NO sender name/number visible\n' +
          '• Completely anonymous\n' +
          '• Unlimited messages\n\n' +
          '⚠️ *Use responsibly!*'
        );
      }

      const parts = raw.split(',').map(x => x.trim());
      
      // Format: message, count, number
      let message = parts[0];
      let count = parseInt(parts[1]);
      let targetNumber = parts[2];
      
      // Validation
      if (!message || isNaN(count) || count <= 0 || !targetNumber) {
        return extra.reply(
          '❌ *Wrong format!*\n\n' +
          'Use: `.boom Your message,100,923001234567`\n\n' +
          'Example: `.boom Hello,50,923162563671`\n\n' +
          '📌 Number must include country code (e.g., 92 for Pakistan)'
        );
      }

      // Clean number
      const cleanNumber = normalizeNumber(targetNumber);
      if (!cleanNumber || cleanNumber.length < 10) {
        return extra.reply('❌ Invalid number! Use: 923001234567 (with country code)');
      }

      const targetJid = toJid(cleanNumber);
      
      // Warning for large counts
      if (count > 500) {
        await extra.reply(`⚠️ *WARNING Owner!*\n\nSending ${count.toLocaleString()} anonymous messages to ${cleanNumber}\nTarget will NOT know it was you.\n\n_Starting in 5 seconds..._`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      await extra.react('💣');
      await extra.reply(`🚀 Starting ANONYMOUS bomb: ${count.toLocaleString()} messages to ${cleanNumber}\n\n🔇 Target will NOT know who sent these!`);

      // Adaptive delay
      let delay = 250;
      if (count > 500) delay = 400;
      if (count > 1000) delay = 600;
      if (count > 5000) delay = 800;

      let successCount = 0;
      let failCount = 0;

      // ANONYMOUS SENDING - No sender info, no bot traces
      for (let i = 1; i <= count; i++) {
        try {
          // Send message WITHOUT any sender identification
          await sock.sendMessage(targetJid, { 
            text: message
            // No quoted message, no context info, no mentions
          });
          
          successCount++;
          
          // Progress only visible to owner (in owner's chat)
          if (i % 100 === 0) {
            await extra.reply(`📊 Anonymous Progress: ${i}/${count} sent to ${cleanNumber}`);
          }
          
          if (delay > 0 && count > 50) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (err) {
          failCount++;
          console.error(`Failed: ${i}`, err);
          
          if (failCount > 10) {
            await extra.reply(`❌ Stopped: ${failCount} failures. Rate limited?`);
            break;
          }
          
          delay += 100;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      await extra.react('💥');
      await extra.reply(
        `✅ *Anonymous Bomb Complete!*\n\n` +
        `📱 Target: ${cleanNumber}\n` +
        `📨 Sent: ${successCount.toLocaleString()}\n` +
        `❌ Failed: ${failCount}\n` +
        `📝 Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}\n\n` +
        `🔇 *Target has NO idea who sent these messages!*`
      );
      
    } catch (error) {
      console.error('Anonymous Bomber Error:', error);
      await extra.reply('❌ Anonymous bomber failed. Check console.');
      await extra.react('❌');
    }
  }
};
