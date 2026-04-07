// commands/silentboom.js
const config = require('../../config');

/**
 * Normalize phone number - Sirf numbers lein
 */
function normalizeNumber(num) {
  return String(num || '').replace(/[^0-9]/g, '');
}

/**
 * Number ko JID mein convert karein
 */
function toJid(num) {
  const n = normalizeNumber(num);
  return n ? `${n}@s.whatsapp.net` : null;
}

module.exports = {
  name: 'silentboom',
  aliases: ['sbomb', 'silentbomb', 'sboom'],
  category: 'fun',
  description: '🔇 Silent Bomber - Messages sirf target ki chat mein dikhein, aapki chat mein nahi',
  usage: '.silentboom <message,count,number>',

  // 👑 Sirf owner use kar sakta hai
  ownerOnly: true,
  modOnly: false,
  groupOnly: false,
  privateOnly: false,
  adminOnly: false,
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      // 🔒 Owner check
      const ownerNumber = config.ownerNumber || config.OWNER_NUMBER;
      const senderNumber = msg.key.remoteJid?.split('@')[0] || '';
      const cleanSender = normalizeNumber(senderNumber);
      const cleanOwner = normalizeNumber(ownerNumber);
      
      if (cleanSender !== cleanOwner) {
        await extra.reply('❌ *Access Denied!*\n\nSirf bot owner is command ko use kar sakta hai.');
        return;
      }
      
      const raw = args.join(' ').trim();
      if (!raw) {
        return extra.reply(
          '*🔇 SILENT BOMBER (Owner Only)*\n\n' +
          '*Usage:*\n' +
          '`.silentboom Hello,100,923162563671`\n\n' +
          '*Features:*\n' +
          '✅ Messages sirf TARGET ki chat mein dikhein\n' +
          '✅ Aapki chat mein KUCH show nahi hoga\n' +
          '✅ Target ko pata nahi chalega kisne bheja\n' +
          '✅ No traces, no reactions, no replies\n\n' +
          '*Example:*\n' +
          '`.silentboom Hi,50,923001234567`'
        );
      }

      const parts = raw.split(',').map(x => x.trim());
      const message = parts[0];
      const count = parseInt(parts[1]);
      const targetNumber = parts[2];
      
      // Validation
      if (!message || isNaN(count) || count <= 0 || !targetNumber) {
        return extra.reply(
          '❌ *Wrong format!*\n\n' +
          'Use: `.silentboom Your message,count,number`\n\n' +
          'Example: `.silentboom Hello,50,923162563671`'
        );
      }

      // Clean target number
      const cleanTarget = normalizeNumber(targetNumber);
      if (!cleanTarget || cleanTarget.length < 10) {
        return extra.reply('❌ Invalid number! Use: 923001234567 (country code ke saath)');
      }

      const targetJid = toJid(cleanTarget);
      
      // ⚠️ Warning for large counts
      if (count > 500) {
        await extra.reply(`⚠️ *WARNING!*\n\n${count} messages bhejne ja rahe hain ${cleanTarget} ko.\n\nYeh silent mode mein hoga - aapki chat mein kuch show nahi hoga.\n\n_Starting in 5 seconds..._`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // 🔇 SILENT MODE - Sirf target tak message jaye
      // Koi reaction nahi, koi reply nahi, koi trace nahi
      
      let successCount = 0;
      let failCount = 0;
      
      // Adaptive delay
      let delay = 250;
      if (count > 500) delay = 400;
      if (count > 1000) delay = 600;
      if (count > 5000) delay = 800;

      // 📤 Messages bhejna start (BILKUL SILENT)
      for (let i = 1; i <= count; i++) {
        try {
          // Sirf target ko message bhejo
          await sock.sendMessage(targetJid, { 
            text: message
          });
          successCount++;
          
          // ⚠️ Sirf aapko dikhega (target ko nahi)
          if (i % 100 === 0 && i < count) {
            // Yeh sirf aapki chat mein jayega (target ko nahi)
            await sock.sendMessage(senderNumber + '@s.whatsapp.net', {
              text: `📊 Silent Progress: ${i}/${count} messages sent to ${cleanTarget}`
            });
          }
          
          if (delay > 0 && count > 50) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (err) {
          failCount++;
          console.error(`Failed: ${i}`, err);
          
          if (failCount > 10) {
            // Sirf aapko inform hoga
            await sock.sendMessage(senderNumber + '@s.whatsapp.net', {
              text: `❌ Stopped: ${failCount} failures. Rate limited?`
            });
            break;
          }
          
          delay += 100;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // ✅ Final Report - Sirf aapko jayegi, target ko nahi
      await sock.sendMessage(senderNumber + '@s.whatsapp.net', {
        text: 
          `✅ *Silent Bomb Complete!*\n\n` +
          `📱 Target: ${cleanTarget}\n` +
          `📨 Sent: ${successCount.toLocaleString()}\n` +
          `❌ Failed: ${failCount}\n` +
          `📝 Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}\n\n` +
          `🔇 *Target ki chat mein ${successCount} messages gaye*\n` +
          `👤 *Aapki chat mein kuch show nahi hua (sirf yeh report)*`
      });
      
      // 🎯 Target ko kuch nahi bhejna - sirf messages gaye
      
    } catch (error) {
      console.error('Silent Bomber Error:', error);
      // Sirf aapko error dikhe
      const senderNumber = msg.key.remoteJid?.split('@')[0] || '';
      await sock.sendMessage(senderNumber + '@s.whatsapp.net', {
        text: '❌ Silent bomber failed. Check console.'
      });
    }
  }
};
