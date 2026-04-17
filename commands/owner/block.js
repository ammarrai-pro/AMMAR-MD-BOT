/**
 * Block Command - Working with Privacy Settings
 */

module.exports = {
  name: 'block',
  aliases: ['blockuser'],
  category: 'owner',
  description: '🚫 Block a user from contacting the bot',
  usage: '.block @user or reply to message',
  ownerOnly: true,
  
  async execute(sock, msg, args, extra) {
    try {
      let target = null;
      
      // Get target user
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid && 
          msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
        target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      
      if (!target && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        target = msg.message.extendedTextMessage.contextInfo.participant;
      }
      
      if (!target && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = msg.message.extendedTextMessage.contextInfo.participant || 
                msg.message.extendedTextMessage.contextInfo.remoteJid;
      }
      
      if (!target && args[0]) {
        let phone = args[0].replace(/[^0-9]/g, '');
        if (phone.length === 10) {
          phone = '92' + phone;
        }
        if (phone.length >= 10) {
          target = `${phone}@s.whatsapp.net`;
        }
      }
      
      if (!target) {
        return extra.reply(`❌ *Usage:* ${this.usage}\n\n📝 *Examples:*\n.block @user\n.block 9234567890\nReply to a message and type .block`);
      }
      
      // Validate JID format
      if (!target.includes('@') || !target.endsWith('s.whatsapp.net')) {
        return extra.reply(`❌ Invalid user format.`);
      }
      
      // Prevent blocking self
      const botNumber = sock.user.id.split(':')[0];
      if (target.includes(botNumber)) {
        return extra.reply(`❌ Cannot block myself! 🤖`);
      }
      
      // Prevent blocking owner
      const isOwner = extra.config.ownerNumber.some(owner => {
        const ownerJid = owner.includes('@') ? owner : `${owner}@s.whatsapp.net`;
        return target === ownerJid;
      });
      
      if (isOwner) {
        return extra.reply(`❌ Cannot block the bot owner! 👑`);
      }
      
      await extra.react('⏳');
      
      // ============================================
      // METHOD 1: Try direct block
      // ============================================
      try {
        await sock.updateBlockStatus(target, 'block');
        
        const successMsg = `✅ *USER BLOCKED* ✅\n\n` +
          `👤 *User:* @${target.split('@')[0]}\n` +
          `👮 *Blocked by:* Owner\n` +
          `📅 *Date:* ${new Date().toLocaleString()}\n\n` +
          `🚫 This user can no longer message the bot.`;
        
        await sock.sendMessage(extra.from, {
          text: successMsg,
          mentions: [target]
        });
        
        await extra.react('🚫');
        return;
        
      } catch (directError) {
        console.log('Direct block failed:', directError.message);
        
        // ============================================
        // METHOD 2: Send message first then block
        // ============================================
        try {
          await extra.reply(`ℹ️ Attempting alternative block method...`);
          
          // Send a test message first
          await sock.sendMessage(target, { 
            text: `You have been blocked from using ${extra.config.botName}.` 
          });
          
          // Wait a moment
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try block again
          await sock.updateBlockStatus(target, 'block');
          
          const successMsg = `✅ *USER BLOCKED* ✅\n\n` +
            `👤 *User:* @${target.split('@')[0]}\n` +
            `👮 *Blocked by:* Owner\n` +
            `📅 *Date:* ${new Date().toLocaleString()}\n\n` +
            `🚫 User has been blocked successfully.`;
          
          await sock.sendMessage(extra.from, {
            text: successMsg,
            mentions: [target]
          });
          
          await extra.react('🚫');
          return;
          
        } catch (secondError) {
          console.log('Second method failed:', secondError.message);
          
          // ============================================
          // METHOD 3: Use group block method
          // ============================================
          try {
            // Create a temporary group? (Too invasive)
            // Instead, just save to database block list
            const blockedByBot = await extra.database.getGlobalSetting('bot_blocked_users') || {};
            blockedByBot[target] = {
              reason: 'Blocked by owner',
              blockedAt: Date.now(),
              blockedBy: msg.key.participant || msg.key.remoteJid
            };
            await extra.database.setGlobalSetting('bot_blocked_users', blockedByBot);
            
            const successMsg = `✅ *USER BLOCKED (BOT LEVEL)* ✅\n\n` +
              `👤 *User:* @${target.split('@')[0]}\n` +
              `👮 *Blocked by:* Owner\n` +
              `📅 *Date:* ${new Date().toLocaleString()}\n\n` +
              `⚠️ *Note:* User has privacy settings enabled.\n` +
              `📌 User is blocked at bot level (cannot use commands).\n\n` +
              `💡 To fully block, manually block from WhatsApp.`;
            
            await sock.sendMessage(extra.from, {
              text: successMsg,
              mentions: [target]
            });
            
            await extra.react('⚠️');
            return;
            
          } catch (thirdError) {
            throw new Error('All block methods failed. User may have maximum privacy settings.');
          }
        }
      }
      
    } catch (error) {
      console.error('Block error:', error);
      
      // Final fallback - Suggest manual block
      const fallbackMsg = `❌ *CANNOT BLOCK USER* ❌\n\n` +
        `Reason: User has privacy settings enabled.\n\n` +
        `📌 *Alternative Solutions:*\n\n` +
        `1️⃣ *Manual Block:*\n` +
        `   Open WhatsApp > Settings > Privacy > Blocked > Add\n\n` +
        `2️⃣ *Use Ban Command:*\n` +
        `   .ban @user Reason\n` +
        `   (This will block bot usage)\n\n` +
        `3️⃣ *Use Bot-Level Block:*\n` +
        `   .botblock @user\n\n` +
        `💡 Recommended: Use .ban @user for instant restriction.`;
      
      await sock.sendMessage(extra.from, {
        text: fallbackMsg,
        mentions: [target]
      });
      await extra.react('❌');
    }
  }
};
