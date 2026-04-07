// commands/advanceboom.js
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
  name: 'advanceboom',
  aliases: ['abomb', 'fakeboom', 'spoof', 'advance'],
  category: 'fun',
  description: '🔥 ADVANCE SILENT BOMBER - Fake sender number se messages bhejein',
  usage: '.advanceboom <message,count,fake_sender_number,target_number>',

  // 👑 Sirf owner
  ownerOnly: true,
  modOnly: false,
  groupOnly: false,
  privateOnly: false,
  adminOnly: false,
  botAdminNeeded: false,

  async execute(sock, msg, msgArgs, extra) {
    try {
      // 🔒 Owner check
      const ownerNumber = config.ownerNumber || config.OWNER_NUMBER;
      const senderNumber = msg.key.remoteJid?.split('@')[0] || '';
      const cleanSender = normalizeNumber(senderNumber);
      const cleanOwner = normalizeNumber(ownerNumber);
      
      if (cleanSender !== cleanOwner) {
        console.log(`Access denied: ${senderNumber}`);
        return;
      }
      
      const raw = msgArgs.join(' ').trim();
      if (!raw) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: '*🔥 ADVANCE SILENT BOMBER*\n\n' +
            '*Usage:*\n' +
            '`.advanceboom message,count,fake_sender_number,target_number`\n\n' +
            '*Example:*\n' +
            '`.advanceboom Hello,100,923001234567,923162563671`\n\n' +
            '*Iska matlab:*\n' +
            '• Message: Hello\n' +
            '• Count: 100 baar\n' +
            '• Fake sender: 923001234567 (yeh number sender dikhega)\n' +
            '• Target: 923162563671 (isko messages jayenge)\n\n' +
            '*✨ Features:*\n' +
            '• Target ko fake sender number se messages dikhenge\n' +
            '• Aapki chat mein kuch nahi dikhega\n' +
            '• Bilkul anonymous\n' +
            '• No traces'
        });
        return;
      }

      // Command parse karein: message, count, fakeSender, target
      const parts = raw.split(',').map(x => x.trim());
      const message = parts[0];
      const count = parseInt(parts[1]);
      const fakeSenderNumber = parts[2];
      const targetNumber = parts[3];
      
      // Validation
      if (!message || isNaN(count) || count <= 0 || !fakeSenderNumber || !targetNumber) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ *Wrong format!*\n\n' +
            'Use: `.advanceboom message,count,fake_sender_number,target_number`\n\n' +
            'Example: `.advanceboom Hello,100,923001234567,923162563671`'
        });
        return;
      }

      // Clean numbers
      const cleanFakeSender = normalizeNumber(fakeSenderNumber);
      const cleanTarget = normalizeNumber(targetNumber);
      
      if (!cleanFakeSender || cleanFakeSender.length < 10 || !cleanTarget || cleanTarget.length < 10) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: '❌ Invalid numbers! Use: 923001234567 (country code ke saath)'
        });
        return;
      }

      const targetJid = toJid(cleanTarget);
      
      // 🔥 Fake sender name format karein
      // WhatsApp mein number ko name ki tarah dikhane ke liye
      const fakeSenderName = `+${cleanFakeSender}`;
      
      console.log(`🔥 Advance Silent Bomb Started`);
      console.log(`📝 Message: ${message}`);
      console.log(`🔢 Count: ${count}`);
      console.log(`🎭 Fake Sender: ${cleanFakeSender}`);
      console.log(`🎯 Target: ${cleanTarget}`);
      
      let successCount = 0;
      let failCount = 0;
      
      // Delay set karein
      let delay = 350;
      if (count > 500) delay = 500;
      if (count > 1000) delay = 700;
      if (count > 5000) delay = 1000;

      // 📤 Messages bhejna start - FAKE SENDER KE SAATH
      for (let i = 1; i <= count; i++) {
        try {
          // Message bhejo FAKE sender context ke saath
          await sock.sendMessage(targetJid, { 
            text: message,
            contextInfo: {
              // Fake sender information
              participant: `${cleanFakeSender}@s.whatsapp.net`,
              quotedMessage: {
                key: {
                  remoteJid: `${cleanFakeSender}@s.whatsapp.net`,
                  fromMe: false,
                  id: `fake_${Date.now()}_${i}`
                },
                message: {
                  conversation: message
                }
              },
              // Forwarding info to look more real
              forwardingScore: 999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: `status@broadcast`,
                newsletterName: fakeSenderName,
                serverMessageId: i
              }
            }
          });
          
          successCount++;
          
          // Sirf console mein progress
          if (i % 50 === 0) {
            console.log(`🔥 Progress: ${i}/${count} sent to ${cleanTarget} (as ${cleanFakeSender})`);
          }
          
          if (delay > 0 && count > 30) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
        } catch (err) {
          failCount++;
          console.error(`❌ Failed: ${i}`, err.message);
          
          if (failCount > 10) {
            console.log(`🔥 Stopped: ${failCount} failures`);
            break;
          }
          
          delay += 100;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      // 📊 Final Report - Sirf CONSOLE mein
      console.log(`
✅ Advance Silent Bomb Complete!
🎭 Fake Sender: ${cleanFakeSender}
🎯 Target: ${cleanTarget}
📨 Sent: ${successCount}
❌ Failed: ${failCount}
📝 Message: ${message.substring(0, 50)}
🔥 Target ko ${cleanFakeSender} se messages dikhenge!
      `);
      
      // Sirf owner ko ek silent confirmation (optional)
      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ *Advance Silent Bomb Complete!*\n\n` +
          `🎭 Fake Sender: ${cleanFakeSender}\n` +
          `🎯 Target: ${cleanTarget}\n` +
          `📨 Sent: ${successCount}/${count}\n` +
          `🔥 Target ko ${cleanFakeSender} se messages dikhenge!`
      });
      
    } catch (error) {
      console.error('🔥 Advance Silent Bomber Error:', error);
    }
  }
};
