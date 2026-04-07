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

  // 🔒 SIRF OWNER AUR BOT NUMBER WALA
  ownerOnly: false,  // Khud se handle karenge
  modOnly: false,
  groupOnly: false,   // ✅ Group mein bhi chalega
  privateOnly: false, // ✅ Private mein bhi chalega
  adminOnly: false,
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      // Get sender info
      const senderNumber = msg.key.remoteJid?.split('@')[0] || '';
      const senderName = msg.pushName || 'User';
      const isGroup = extra.isGroup || false;
      
      // 🔐 ALLOWED USERS: Owner + Bot Number Owner
      const ownerNumber = config.ownerNumber || config.OWNER_NUMBER || '';
      const botNumber = config.botNumber || config.BOT_NUMBER || '';
      
      // Clean numbers for comparison
      const cleanSender = normalizeNumber(senderNumber);
      const cleanOwner = normalizeNumber(ownerNumber);
      const cleanBot = normalizeNumber(botNumber);
      
      // Check if sender is authorized (Owner OR Bot Number owner)
      const isAuthorized = (cleanOwner && cleanSender === cleanOwner) || 
                          (cleanBot && cleanSender === cleanBot);
      
      if (!isAuthorized) {
        await extra.reply(
          '❌ *Access Denied!*\n\n' +
          'Only the following can use this command:\n' +
          '• Bot Owner\n' +
          '• Person whose number is connected to the bot\n\n' +
          '_Contact owner for access._'
        );
        return;
      }
      
      const raw = args.join(' ').trim();
      if (!raw) {
        return extra.reply(
          '*💣 ANONYMOUS UNLIMITED BOMBER*\n\n' +
          '✅ *Group Support*\n' +
          '✅ *Private Chat Support*\n' +
          '✅ *Anonymous Sending*\n\n' +
          '*Usage:*\n' +
          '• `.boom Hello,100,923001234567` (send to number)\n' +
          '• `.boom Hi,50` (send to current chat)\n' +
          '• `.boom Hey,200` (send to current group)\n\n' +
          '🔒 *Authorized: Bot Owner & Bot Number User*\n' +
          '⚠️ *Target will NOT know who sent!*'
        );
      }

      const parts = raw.split(',').map(x => x.trim());
      const message = parts[0];
      const count = parseInt(parts[1]);
      let targetNumber = parts[2] || ''; // Optional now
      
      // Validation
      if (!message || isNaN(count) || count <= 0) {
        return extra.reply(
          '❌ *Wrong format!*\n\n' +
          '• Current chat: `.boom Hello,50`\n' +
          '• Specific number: `.boom Hello,50,923001234567`\n' +
          '• Group: `.boom Hello,100`\n\n' +
          'Count must be a positive number (no limit!)'
        );
      }
      
      // Determine target
      let targetJid;
      let targetDisplay;
      let isTargetNumber = false;
      
      if (targetNumber) {
        // Send to specific number
        const cleanTarget = normalizeNumber(targetNumber);
        if (!cleanTarget || cleanTarget.length < 10) {
          return extra.reply('❌ Invalid number! Use: 923001234567 (with country code)');
        }
        targetJid = toJid(cleanTarget);
        targetDisplay = cleanTarget;
        isTargetNumber = true;
      } else {
        // Send to current chat (group or private)
        targetJid = extra.from;
        if (isGroup) {
          targetDisplay = 'this group';
        } else {
          targetDisplay = 'this chat';
        }
        isTargetNumber = false;
      }
      
      // Warning for large counts
      if (count > 500) {
        await extra.reply(
          `⚠️ *WARNING!*\n\n` +
          `Sending ${count.toLocaleString()} anonymous messages to ${targetDisplay}\n` +
          `Target will NOT know who sent.\n\n` +
          `_Starting in 5 seconds..._`
        );
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      // Show starting message (only visible to sender)
      await extra.react('💣');
      await extra.reply(
        `🚀 *Starting Anonymous Bomb*\n\n` +
        `📨 Messages: ${count.toLocaleString()}\n` +
        `📍 Target: ${targetDisplay}\n` +
        `🔇 Anonymous Mode: ON\n\n` +
        `_Sending..._`
      );
      
      // Adaptive delay
      let delay = 250;
      if (count > 500) delay = 400;
      if (count > 1000) delay = 600;
      if (count > 5000) delay = 800;
      
      let successCount = 0;
      let failCount = 0;
      
      // Send messages anonymously
      for (let i = 1; i <= count; i++) {
        try {
          await sock.sendMessage(targetJid, { 
            text: message
          });
          successCount++;
          
          // Progress update every 100 messages (only to sender)
          if (i % 100 === 0 && i < count) {
            await extra.reply(`📊 Progress: ${i}/${count} messages sent to ${targetDisplay}`);
          }
          
          // Delay to avoid rate limits
          if (delay > 0 && count > 50) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (err) {
          failCount++;
          console.error(`Failed message ${i}:`, err);
          
          if (failCount > 10) {
            await extra.reply(`❌ Stopped: Too many failures (${failCount}). Rate limited?`);
            break;
          }
          
          delay += 100;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      // Final report (only to sender)
      await extra.react('💥');
      await extra.reply(
        `✅ *Anonymous Bomb Complete!*\n\n` +
        `📍 Target: ${targetDisplay}\n` +
        `📨 Sent: ${successCount.toLocaleString()}\n` +
        `❌ Failed: ${failCount}\n` +
        `📝 Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}\n` +
        `⚡ Speed: ~${Math.round(successCount / ((successCount + failCount) * delay / 1000)) || 1} msg/sec\n\n` +
        `🔇 *Target has NO idea who sent!*`
      );
      
    } catch (error) {
      console.error('Anonymous Bomber Error:', error);
      await extra.reply('❌ Anonymous bomber failed. Check console.');
      await extra.react('❌');
    }
  }
};
