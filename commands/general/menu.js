/**
 * Menu Command - Display all available commands
 * Fixed: UTILITY aur TEXTMAKER categories ab show hongi
 */

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  category: 'general',
  description: 'Show all available commands',
  usage: '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const commands = loadCommands();
      const categories = {};

      // Group commands by category (main names only)
      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          // ✅ FIX: category ko lowercase mein kar do
          let categoryKey = cmd.category ? cmd.category.toLowerCase() : 'other';
          if (!categories[categoryKey]) categories[categoryKey] = [];
          categories[categoryKey].push(cmd);
        }
      });

      // Get owner name and bot name
      const ownerNames = Array.isArray(config.ownerName) ? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || 'Bot Owner';
      const botName = config.botName || 'AMMAR-MD-BOT';
      const userTag = extra.sender.split('@')[0];

      // Build header
      let menuText = `╭━  ${botName}  ━╮\n`;
      menuText += `┃  Owner: ${displayOwner}\n`;
      menuText += `┃  User: @${userTag}\n`;
      menuText += `┃  Prefix: ${config.prefix}\n`;
      menuText += `┃  Cmds: ${commands.size}\n`;
      menuText += `╰━━━━━━━━━━━━━━━╯\n\n`;

      // Category order (sab lowercase mein)
      const categoryOrder = [
        { key: 'general', name: 'GENERAL COMMANDS' },
        { key: 'ai', name: 'AI COMMANDS' },
        { key: 'group', name: 'GROUP COMMANDS' },
        { key: 'owner', name: 'OWNER COMMANDS' },
        { key: 'media', name: 'MEDIA COMMANDS' },
        { key: 'fun', name: 'FUN COMMANDS' },
        { key: 'utility', name: 'UTILITY COMMANDS' },      // ✅ ab yeh match karega
        { key: 'anime', name: 'ANIME COMMANDS' },
        { key: 'textmaker', name: 'TEXTMAKER COMMANDS' }   // ✅ ab yeh bhi match karega
      ];

      for (const cat of categoryOrder) {
        const cmdList = categories[cat.key];
        if (cmdList && cmdList.length) {
          menuText += `╭─❖ ${cat.name} \n│ \n`;
          cmdList.forEach(cmd => {
            menuText += `│ -   ${config.prefix}${cmd.name}\n`;
          });
          menuText += `╰──────────────\n\n`;
        }
      }

      menuText += `💡 Type ${config.prefix}help <command> for more info\n`;
      menuText += `🌟 Bot Version: ${config.version || '1.0.0'}\n`;

      // Send with image if available
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        await sock.sendMessage(extra.from, {
          image: imageBuffer,
          caption: menuText,
          mentions: [extra.sender],
          contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: config.newsletterJid || '120363405564344038@newsletter',
              newsletterName: botName,
              serverMessageId: -1
            }
          }
        }, { quoted: msg });
      } else {
        await sock.sendMessage(extra.from, {
          text: menuText,
          mentions: [extra.sender]
        }, { quoted: msg });
      }

    } catch (error) {
      console.error('Menu error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  }
};
