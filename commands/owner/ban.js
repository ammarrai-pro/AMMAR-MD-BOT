// commands/owner/ban.js
// Owner Only - Ban users from using the bot

module.exports = {
  name: 'ban',
  aliases: ['block', 'restrict', 'banuser'],
  category: 'owner',
  description: '🔨 Ban a user from using the bot',
  usage: '.ban @user [reason] [time]',
  ownerOnly: true,
  
  async execute(sock, msg, args, extra) {
    try {
      // Get target user
      let targetUser = null;
      let reason = 'No reason provided';
      let duration = null;
      
      // Check mentioned user
      if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid) {
        targetUser = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }
      
      // Check replied user
      if (!targetUser && msg.message?.extendedTextMessage?.contextInfo?.participant) {
        targetUser = msg.message.extendedTextMessage.contextInfo.participant;
      }
      
      // Check quoted message
      if (!targetUser && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        targetUser = msg.message.extendedTextMessage.contextInfo.participant || 
                    msg.message.extendedTextMessage.contextInfo.remoteJid;
      }
      
      // Check if user provided number in args
      if (!targetUser && args[0]) {
        const phoneMatch = args[0].match(/(\d+)/);
        if (phoneMatch) {
          targetUser = `${phoneMatch[0]}@s.whatsapp.net`;
        }
      }
      
      if (!targetUser) {
        return extra.reply(`❌ *Usage:* ${this.usage}\n\n📝 *Examples:*\n.ban @user Spamming\n.ban @user Abuse 1d\n.ban 9234567890 Testing\n\n⏰ *Time formats:* 1h, 1d, 1w, 1m`);
      }
      
      // Parse reason and duration
      let argsText = args.join(' ');
      const timeMatch = argsText.match(/(\d+)([hdwm])/i);
      
      if (timeMatch) {
        const value = parseInt(timeMatch[1]);
        const unit = timeMatch[2].toLowerCase();
        
        switch(unit) {
          case 'h': duration = value * 60 * 60 * 1000; break;
          case 'd': duration = value * 24 * 60 * 60 * 1000; break;
          case 'w': duration = value * 7 * 24 * 60 * 60 * 1000; break;
          case 'm': duration = value * 30 * 24 * 60 * 60 * 1000; break;
        }
        
        argsText = argsText.replace(timeMatch[0], '').trim();
      }
      
      reason = argsText || 'No reason provided';
      
      // Prevent banning owner
      const isOwner = extra.config.ownerNumber.some(owner => 
        targetUser.includes(owner) || targetUser === `${owner}@s.whatsapp.net`
      );
      
      if (isOwner) {
        return extra.reply(`❌ Cannot ban the bot owner! 👑`);
      }
      
      // Check if already banned
      const bannedUsers = await extra.database.getGlobalSetting('banned_users') || {};
      if (bannedUsers[targetUser] && (!bannedUsers[targetUser].expires || bannedUsers[targetUser].expires > Date.now())) {
        const remaining = bannedUsers[targetUser].expires ? 
          `\n⏰ Expires: ${new Date(bannedUsers[targetUser].expires).toLocaleString()}` : 
          '\n⚠️ Permanent Ban';
        return extra.reply(`❌ User is already banned!${remaining}`);
      }
      
      // Prepare ban data
      const banData = {
        reason: reason,
        bannedBy: msg.key.participant || msg.key.remoteJid,
        bannedAt: Date.now(),
        expires: duration ? Date.now() + duration : null,
        type: duration ? 'Temporary' : 'Permanent',
        duration: duration
      };
      
      // Save ban
      bannedUsers[targetUser] = banData;
      await extra.database.setGlobalSetting('banned_users', bannedUsers);
      
      // Format duration text
      let durationText = '';
      if (duration) {
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);
        if (days > 0) {
          durationText = `⏰ Duration: ${days} day(s) (${hours} hours)`;
        } else {
          durationText = `⏰ Duration: ${hours} hour(s)`;
        }
      } else {
        durationText = '⚠️ Permanent Ban';
      }
      
      // Send ban notification
      const banMessage = `🔨 *ＢＡＮ ＮＯＴＩＦＩＣＡＴＩＯＮ* 🔨\n\n` +
        `👤 *User:* @${targetUser.split('@')[0]}\n` +
        `📝 *Reason:* ${reason}\n` +
        `${durationText}\n` +
        `👮 *Banned by:* Owner\n` +
        `📅 *Date:* ${new Date().toLocaleString()}\n\n` +
        `🚫 This user cannot use any bot commands until unbanned.`;
      
      await sock.sendMessage(extra.from, {
        text: banMessage,
        mentions: [targetUser]
      });
      
      // Notify banned user
      try {
        await sock.sendMessage(targetUser, {
          text: `🔨 *ＹＯＵ ＨＡＶＥ ＢＥＥＮ ＢＡＮＮＥＤ* 🔨\n\n` +
            `📝 *Reason:* ${reason}\n` +
            `${durationText}\n\n` +
            `📞 Contact owner for appeal: ${extra.config.ownerNumber[0]}\n\n` +
            `*Bot:* ${extra.config.botName}`
        });
      } catch (e) {
        console.log('Could not notify banned user');
      }
      
      await extra.react('🔨');
      
      // Auto-unban timer
      if (duration) {
        setTimeout(async () => {
          const currentBans = await extra.database.getGlobalSetting('banned_users') || {};
          if (currentBans[targetUser] && currentBans[targetUser].expires <= Date.now()) {
            delete currentBans[targetUser];
            await extra.database.setGlobalSetting('banned_users', currentBans);
            console.log(`✅ Auto-unbanned: ${targetUser}`);
            
            // Notify user
            try {
              await sock.sendMessage(targetUser, {
                text: `✅ *ＵＮＢＡＮ ＮＯＴＩＦＩＣＡＴＩＯＮ*\n\nYour ban has expired. You can now use ${extra.config.botName} again! 🎉`
              });
            } catch(e) {}
          }
        }, duration);
      }
      
    } catch (error) {
      await extra.reply(`❌ Error: ${error.message}`);
      await extra.react('❌');
    }
  }
};
