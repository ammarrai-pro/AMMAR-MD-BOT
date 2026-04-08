/**
 * Menu Command - Auto-adjust borders for WhatsApp
 * No complex alignment, simple lines that wrap correctly
 * Automatically shows ALL categories including UTILITY and TEXTMAKER
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

      // Group commands by category (normalize to lowercase)
      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          let cat = cmd.category ? cmd.category.toLowerCase().trim() : 'other';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(cmd);
        }
      });

      // Debug: Console mein dekhein kaunsi categories mili
      console.log('\n========== MENU CATEGORIES ==========');
      for (const [cat, cmds] of Object.entries(categories)) {
        console.log(`- ${cat} : ${cmds.length} commands`);
      }
      console.log('=====================================\n');

      // Owner & Bot Info
      const ownerNames = Array.isArray(config.ownerName) ? config.ownerName : [config.ownerName];
      const displayOwner = ownerNames[0] || 'Bot Owner';
      const botName = config.botName || 'AMMAR-MD-BOT';
      const userTag = extra.sender.split('@')[0];
      const prefix = config.prefix || '.';

      // Simple header (no complex borders, just lines)
      let menuText = `┌─────────────────────────────────────┐\n`;
      menuText += `│           ${botName}           │\n`;
      menuText += `├─────────────────────────────────────┤\n`;
      menuText += `│ Owner   : ${displayOwner}\n`;
      menuText += `│ User    : @${userTag}\n`;
      menuText += `│ Prefix  : ${prefix}\n`;
      menuText += `│ Commands: ${commands.size}\n`;
      menuText += `└─────────────────────────────────────┘\n\n`;

      // Define preferred order for categories (but all will show)
      const preferredOrder = [
        'general', 'ai', 'group', 'owner', 'media', 'fun',
        'utility', 'anime', 'textmaker', 'download', 'tools', 'other'
      ];

      // First show categories in preferred order
      const shownCategories = new Set();
      for (const cat of preferredOrder) {
        if (categories[cat] && categories[cat].length > 0) {
          shownCategories.add(cat);
          menuText += `┌────[ ${cat.toUpperCase()} COMMANDS ]────┐\n`;
          menuText += `│\n`;
          const cmdList = categories[cat];
          // Show commands in simple list
          cmdList.forEach(cmd => {
            menuText += `│ • ${prefix}${cmd.name}\n`;
          });
          menuText += `│\n`;
          menuText += `└─────────────────────────────────────┘\n\n`;
        }
      }

      // Then show any remaining categories not in preferred order
      for (const cat in categories) {
        if (!shownCategories.has(cat) && categories[cat].length > 0) {
          menuText += `┌────[ ${cat.toUpperCase()} COMMANDS ]────┐\n`;
          menuText += `│\n`;
          categories[cat].forEach(cmd => {
            menuText += `│ • ${prefix}${cmd.name}\n`;
          });
          menuText += `│\n`;
          menuText += `└─────────────────────────────────────┘\n\n`;
        }
      }

      // Footer
      menuText += `┌─────────────────────────────────────┐\n`;
      menuText += `│ 💡 Type ${prefix}help <command> for details │\n`;
      menuText += `│ 📱 Version: ${config.version || '1.0.0'}                │\n`;
      menuText += `└─────────────────────────────────────┘`;

      // Send message
      const imagePath = path.join(__dirname, '../../utils/bot_image.jpg');
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        await sock.sendMessage(extra.from, {
          image: imageBuffer,
          caption: menuText,
          mentions: [extra.sender]
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
