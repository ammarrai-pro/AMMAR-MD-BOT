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
  aliases: ['sbomb', 'silent', 'sboom'],
  category: 'fun',
  description: '🔇 SILENT BOMBER - Messages sirf target ki chat mein jayenge, aapko kuch nahi dikhega',
  usage: '.silentboom <message,count,number>',

  // 👑 Sirf owner use kar sakta hai (badal sakte ho)
  ownerOnly: true,
  modOnly: false,
  groupOnly: false,
  privateOnly: false,
  adminOnly: false,
  botAdminNeeded: false,

  async execute(sock, msg, args, extra) {
    try {
      // 🔒 Owner check (optional - hatana ho to hata do)
      const ownerNumber = config.ownerNumber || config.OWNER_NUMBER;
      const senderNumber = msg.key.remoteJid?.split('@')[0] || '';
      const cleanSender = normalizeNumber(senderNumber);
      const cleanOwner = normalizeNumber(ownerNumber);
      
      if (ownerNumber && cleanSender !== cleanOwner) {
        // Sirf owner ko pata chalega ke access deny hua
        console.log(`Access denied for: ${senderNumber}`);
        return; // Kuch bhi reply nahi karna - bilkul silent
      }
      
      const raw = args.join(' ').trim();
      if (!raw) {
        // Sirf owner ko usage dikhega (taake pata ho command kaise use karni hai)
        await sock.sendMessage(msg.key.remoteJid, {
          text: '*🔇 SILENT BOMBER*\n\n' +
            'Usage: `.silentboom message,count,number`\n\n' +
            'Example: `.silentboom Hello,100,923162563671`\n\n' +
            '✨ Features:\n' +
            '• Messages sirf TARGET ki chat mein jayenge\n' +
            '• Aapki chat mein KUCH show nahi hoga\n' +
            '• Target ko pata nahi chalega\n' +
            '• No reactions, no replies, no traces'
        });
        return;
      }

      const parts = raw.split(',').map(x => x.trim());
      const message = parts[0];
      const count = parseInt(parts[1]);
      const targetNumber = parts[2];
      
      // Validation
      if (!message || isNaN(count) || count <= 0 || !targetNumber) {
        // Sirf owner ko error dikhega
        await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Wrong format! Use: `.silentboom message,count,number`\nExample: `.silentboom Hello,50,923162563671`'
        });
        return;
      }

      // Clean target number
      const cleanTarget = normalizeNumber(targetNumber);
      if (!cleanTarget || cleanTarget.length < 10) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Invalid number! Use: 923001234567 (country code ke saath)'
        });
        return;
      }

      const targetJid = toJid(cleanTarget);
      
      // 🔇 BILKUL SILENT - Koi warning nahi, koi confirmation nahi
      // Sirf console mein log hoga (aap dekh sakte ho)
      console.log(`🔇 Silent bomb started: ${count} messages to ${cleanTarget}`);
      
      let successCount = 0;
      let failCount = 0;
      
      // Delay set karein
      let delay = 300;
      if (count > 500) delay = 400;
      if (count > 1000) delay = 600;
      if (count > 5000) delay = 800;

      // 📤 Messages bhejna start - BILKUL SILENT
      for (let i = 1; i <= count; i++) {
        try {
          await sock.sendMessage(targetJid, { 
            text: message
          });
          successCount++;
          
          // Sirf console mein progress dikhega
          if (i % 100 === 0) {
            console.log(`🔇 Silent progress: ${i}/${count} sent to ${cleanTarget}`);
          }
          
          if (delay > 0 && count > 50) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (err) {
          failCount++;
          console.error(`❌ Silent bomb failed: ${i}`, err.message);
          
          if (failCount > 10) {
            console.log(`🔇 Stopped: ${failCount} failures`);
            break;
          }
          
          delay += 100;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // 📊 Final Report - Sirf CONSOLE mein dikhega, WhatsApp pe kuch nahi
      console.log(`
✅ Silent Bomb Complete!
📱 Target: ${cleanTarget}
📨 Sent: ${successCount}
❌ Failed: ${failCount}
📝 Message: ${message.substring(0, 50)}
🔇 Target ki chat mein ${successCount} messages gaye
👤 Aapki chat mein KUCH show nahi hua
      `);
      
      // 🎯 Yahan par koi WhatsApp message nahi bhejna
      // Sirf console mein log hoga
      
    } catch (error) {
      console.error('❌ Silent Bomber Error:', error);
      // Koi WhatsApp reply nahi - bilkul silent
    }
  }
};
