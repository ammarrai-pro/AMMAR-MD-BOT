/**
 * Block Command - Fixed "bad-request" error
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
      
      // Method 1: Check for mentioned user
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid && 
          msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
        target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      
      // Method 2: Check if replying to a message
      if (!target && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        target = msg.message.extendedTextMessage.contextInfo.participant;
      }
      
      // Method 3: Check quoted message
      if (!target && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = msg.message.extendedTextMessage.contextInfo.participant || 
                msg.message.extendedTextMessage.contextInfo.remoteJid;
      }
      
      // Method 4: Check if phone number provided in args
      if (!target && args[0]) {
        // Clean the phone number
        let phone = args[0].replace(/[^0-9]/g, '');
        if (phone.length === 10) {
          phone = '92' + phone; // Pakistan code
        }
        if (phone.length >= 10) {
          target = `${phone}@s.whatsapp.net`;
        }
      }
      
      // If no target found
      if (!target) {
        return extra.reply(`❌ *Usage:* ${this.usage}\n\n📝 *Examples:*\n.block @user\n.block 9234567890\nReply to a message and type .block`);
      }
      
      // Validate JID format
      if (!target.includes('@') || !target.endsWith('s.whatsapp.net')) {
        return extra.reply(`❌ Invalid user format. Use: .block 9234567890 or .block @user`);
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
      
      // FIX: Check if user exists first
      try {
        // Try to get user presence to verify existence
        const presence = await sock.presenceSubscribe(target);
        if (!presence) {
          // User might not exist, but continue anyway
          console.log('User may not exist:', target);
        }
      } catch (e) {
        console.log('Presence check failed:', e.message);
      }
      
      // FIX: Use try-catch with specific error handling for block
      try {
        await sock.updateBlockStatus(target, 'block');
      } catch (blockError) {
        // Handle specific block errors
        if (blockError.message.includes('bad-request')) {
          // Alternative method: Send a message then block
          try {
            await sock.sendMessage(target, { text: 'You have been blocked from using this bot.' });
            await new Promise(resolve => setTimeout(resolve, 1000));
            await sock.updateBlockStatus(target, 'block');
          } catch (retryError) {
            throw new Error('Cannot block user. User may have privacy settings enabled.');
          }
        } else {
          throw blockError;
        }
      }
      
      // Send success message
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
      
    } catch (error) {
      console.error('Block error:', error);
      
      // User-friendly error messages
      if (error.message.includes('bad-request')) {
        await extra.reply(`❌ Cannot block user.\n\nPossible reasons:\n• User has privacy settings enabled\n• User doesn't exist\n• Invalid phone number\n\nTry: .block @user (mention them directly)`);
      } else if (error.message.includes('405')) {
        await extra.reply(`❌ Rate limited. Please wait a few seconds and try again.`);
      } else if (error.message.includes('403')) {
        await extra.reply(`❌ Permission denied. Bot may need to be re-authenticated.`);
      } else {
        await extra.reply(`❌ Error: ${error.message}`);
      }
      await extra.react('❌');
    }
  }
};
