/**
 * Block Command - Block a user (FIXED)
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
        const phoneMatch = args[0].match(/(\d+)/);
        if (phoneMatch) {
          target = `${phoneMatch[0]}@s.whatsapp.net`;
        }
      }
      
      // If no target found
      if (!target) {
        return extra.reply(`❌ *Usage:* ${this.usage}\n\n📝 *Examples:*\n.block @user\n.block 9234567890\nReply to a message and type .block`);
      }
      
      // Prevent blocking self
      const botNumber = sock.user.id.split(':')[0];
      if (target.includes(botNumber)) {
        return extra.reply(`❌ Cannot block myself! 🤖`);
      }
      
      // Prevent blocking owner
      const isOwner = extra.config.ownerNumber.some(owner => 
        target.includes(owner) || target === `${owner}@s.whatsapp.net`
      );
      
      if (isOwner) {
        return extra.reply(`❌ Cannot block the bot owner! 👑`);
      }
      
      // Check if already blocked
      try {
        const blockList = await sock.fetchBlocklist();
        if (blockList && blockList.includes(target)) {
          return extra.reply(`ℹ️ User @${target.split('@')[0]} is already blocked!`, { mentions: [target] });
        }
      } catch (e) {
        // Ignore fetch error
      }
      
      // Block the user
      await sock.updateBlockStatus(target, 'block');
      
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
      
      // Try to notify the blocked user
      try {
        await sock.sendMessage(target, {
          text: `🚫 *ＢＬＯＣＫＥＤ* 🚫\n\nYou have been blocked by ${extra.config.botName} owner.\n\nReason: Violation of bot policies.\n\nContact: ${extra.config.ownerNumber[0]}`
        });
      } catch (e) {
        // User might already be blocked or doesn't exist
        console.log('Could not notify blocked user');
      }
      
      await extra.react('🚫');
      
    } catch (error) {
      console.error('Block error:', error);
      
      // Handle specific errors
      if (error.message.includes('405')) {
        await extra.reply(`❌ Cannot block user. WhatsApp might have rate limits. Try again later.`);
      } else if (error.message.includes('403')) {
        await extra.reply(`❌ Permission denied. Make sure bot has proper authentication.`);
      } else {
        await extra.reply(`❌ Error: ${error.message}`);
      }
    }
  }
};
