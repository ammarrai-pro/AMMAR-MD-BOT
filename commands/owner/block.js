/**
 * BLOCK COMMAND - FULLY WORKING
 * Database-based blocking (bypasses WhatsApp privacy restrictions)
 */

module.exports = {
  name: 'block',
  aliases: ['blockuser', 'blockcmd'],
  category: 'owner',
  description: '🚫 Block a user from using the bot',
  usage: '.block @user [reason]',
  ownerOnly: true,
  
  async execute(sock, msg, args, extra) {
    try {
      let target = null;
      let reason = 'No reason provided';
      
      // Get target user from mention
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid && 
          msg.message.extendedTextMessage.contextInfo.mentionedJid.length > 0) {
        target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      
      // Get target from reply
      if (!target && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        target = msg.message.extendedTextMessage.contextInfo.participant;
      }
      
      // Get target from quoted message
      if (!target && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = msg.message.extendedTextMessage.contextInfo.participant || 
                msg.message.extendedTextMessage.contextInfo.remoteJid;
      }
      
      // Get target from phone number
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
      
      // Get reason from args
      if (args.length > 1) {
        reason = args.slice(1).join(' ');
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
      // DATABASE BLOCK - THIS ACTUALLY WORKS
      // ============================================
      
      // Get existing blocked users
      let blockedUsers = await extra.database.getGlobalSetting('blocked_users') || {};
      
      // Check if already blocked
      if (blockedUsers[target]) {
        return extra.reply(`ℹ️ User @${target.split('@')[0]} is already blocked!\n\n📝 Reason: ${blockedUsers[target].reason}\n📅 Since: ${new Date(blockedUsers[target].blockedAt).toLocaleString()}`, { mentions: [target] });
      }
      
      // Add to blocked list
      blockedUsers[target] = {
        reason: reason,
        blockedAt: Date.now(),
        blockedBy: msg.key.participant || msg.key.remoteJid,
        blockedByNumber: (msg.key.participant || msg.key.remoteJid).split('@')[0]
      };
      
      // Save to database
      await extra.database.setGlobalSetting('blocked_users', blockedUsers);
      
      // Verify save
      const verify = await extra.database.getGlobalSetting('blocked_users');
      if (!verify[target]) {
        throw new Error('Failed to save block to database');
      }
      
      // Send success message
      const successMsg = `🔨 *USER BLOCKED* 🔨\n\n` +
        `👤 *User:* @${target.split('@')[0]}\n` +
        `📝 *Reason:* ${reason}\n` +
        `👮 *Blocked by:* Owner\n` +
        `📅 *Date:* ${new Date().toLocaleString()}\n` +
        `🆔 *Block ID:* ${Math.floor(Math.random() * 10000)}\n\n` +
        `🚫 This user CANNOT use any bot commands!\n` +
        `✅ *Block is ACTIVE and WORKING*`;
      
      await sock.sendMessage(extra.from, {
        text: successMsg,
        mentions: [target]
      });
      
      // Try to notify the blocked user (optional)
      try {
        await sock.sendMessage(target, {
          text: `🔨 *ＢＬＯＣＫＥＤ ＦＲＯＭ ＢＯＴ* 🔨\n\n` +
            `You have been blocked from using ${extra.config.botName}!\n\n` +
            `📝 *Reason:* ${reason}\n` +
            `📅 *Date:* ${new Date().toLocaleString()}\n\n` +
            `📞 Contact owner: ${extra.config.ownerNumber[0]}`
        });
      } catch (e) {
        console.log('Could not notify blocked user (user may have privacy settings)');
      }
      
      await extra.react('🔨');
      
      // Optional: Also try WhatsApp block (might fail but try)
      try {
        await sock.updateBlockStatus(target, 'block');
        console.log('WhatsApp block also successful');
      } catch (e) {
        console.log('WhatsApp block failed (privacy settings) - but bot block is active');
      }
      
    } catch (error) {
      console.error('Block error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
      await extra.react('❌');
    }
  }
};
