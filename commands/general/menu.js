/**
 * Interactive Button Menu System
 * Click on category buttons to view commands
 */

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands'],
  category: 'general',
  description: '📋 Interactive Menu with Buttons',
  usage: '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const commands = loadCommands();
      const categories = {};
      const userTag = extra.sender.split('@')[0];
      const prefix = config.prefix || '.';
      const botName = config.botName || '✨ BOT ✨';

      // Group commands by category
      commands.forEach((cmd, name) => {
        if (cmd.name === name) {
          if (!categories[cmd.category]) categories[cmd.category] = [];
          categories[cmd.category].push(cmd);
        }
      });

      // Category configuration with buttons
      const categoryButtons = [
        { id: 'menu_general', name: '📌 GENERAL', category: 'general' },
        { id: 'menu_ai', name: '🤖 AI', category: 'ai' },
        { id: 'menu_group', name: '👥 GROUP', category: 'group' },
        { id: 'menu_owner', name: '⚙️ OWNER', category: 'owner' },
        { id: 'menu_media', name: '🎥 MEDIA', category: 'media' },
        { id: 'menu_fun', name: '🎮 FUN', category: 'fun' },
        { id: 'menu_utility', name: '🔧 UTILITY', category: 'utility' },
        { id: 'menu_anime', name: '🎌 ANIME', category: 'anime' },
        { id: 'menu_textmaker', name: '✍️ TEXTMAKER', category: 'textmaker' },
        { id: 'menu_all', name: '📋 ALL COMMANDS', category: 'all' }
      ];

      // Create interactive buttons
      const buttons = categoryButtons.map(btn => ({
        buttonId: btn.id,
        buttonText: { displayText: btn.name },
        type: 1
      }));

      // Header message
      let headerText = `╭───────────────────╮\n`;
      headerText += `│   ${botName}   │\n`;
      headerText += `╰───────────────────╯\n\n`;
      headerText += `👋 Hello @${userTag}\n`;
      headerText += `📝 Click on any button below to see commands\n`;
      headerText += `⚡ Total Commands: ${commands.size}\n`;
      headerText += `🔰 Prefix: ${prefix}\n\n`;
      headerText += `💡 Tip: Select a category to view commands`;

      // Send button message
      const buttonMessage = {
        text: headerText,
        footer: '🤖 WhatsApp Bot',
        buttons: buttons,
        headerType: 1,
        mentions: [extra.sender]
      };

      await sock.sendMessage(extra.from, buttonMessage, { quoted: msg });

      // Store session for button responses
      if (!global.menuSessions) global.menuSessions = new Map();
      global.menuSessions.set(extra.sender, {
        categories: categories,
        prefix: prefix,
        timestamp: Date.now()
      });

      // Auto cleanup after 5 minutes
      setTimeout(() => {
        if (global.menuSessions.has(extra.sender)) {
          global.menuSessions.delete(extra.sender);
        }
      }, 300000);

    } catch (error) {
      console.error('Menu error:', error);
      await extra.reply(`❌ Error: ${error.message}`);
    }
  },

  // Handle button clicks
  async handleButton(sock, buttonData, extra) {
    try {
      const buttonId = buttonData.buttonId;
      const sender = extra.sender;
      const session = global.menuSessions?.get(sender);
      
      if (!session) {
        await sock.sendMessage(extra.from, {
          text: '❌ Session expired! Please send .menu again'
        }, { quoted: extra.msg });
        return;
      }

      const { categories, prefix } = session;
      const categoryId = buttonId.replace('menu_', '');
      
      let responseText = '';
      let categoryName = '';

      // Category display names
      const categoryNames = {
        general: '📌 GENERAL COMMANDS',
        ai: '🤖 AI COMMANDS',
        group: '👥 GROUP COMMANDS',
        owner: '⚙️ OWNER COMMANDS',
        media: '🎥 MEDIA COMMANDS',
        fun: '🎮 FUN COMMANDS',
        utility: '🔧 UTILITY COMMANDS',
        anime: '🎌 ANIME COMMANDS',
        textmaker: '✍️ TEXTMAKER COMMANDS',
        all: '📋 ALL COMMANDS'
      };

      if (categoryId === 'all') {
        // Show all commands grouped by category
        responseText = `╭───────────────────╮\n`;
        responseText += `│   📋 ALL COMMANDS   │\n`;
        responseText += `╰───────────────────╯\n\n`;
        
        for (const [cat, cmds] of Object.entries(categories)) {
          if (cmds && cmds.length) {
            responseText += `┌─[ ${categoryNames[cat] || cat.toUpperCase()} ]─┐\n`;
            responseText += `│\n`;
            const cmdList = cmds.map(cmd => `  ✦ ${prefix}${cmd.name}`).join('\n');
            responseText += `${cmdList}\n`;
            responseText += `│\n`;
            responseText += `└─────────────────┘\n\n`;
          }
        }
      } else {
        // Show specific category commands
        const cmdList = categories[categoryId];
        categoryName = categoryNames[categoryId] || categoryId.toUpperCase();
        
        if (cmdList && cmdList.length) {
          responseText = `╭───────────────────╮\n`;
          responseText += `│   ${categoryName}   │\n`;
          responseText += `╰───────────────────╯\n\n`;
          responseText += `📝 Total: ${cmdList.length} commands\n`;
          responseText += `🔰 Prefix: ${prefix}\n\n`;
          responseText += `┌─────────────────┐\n`;
          responseText += `│  COMMANDS LIST   │\n`;
          responseText += `├─────────────────┤\n`;
          
          cmdList.forEach((cmd, idx) => {
            responseText += `│  ${(idx + 1).toString().padStart(2)}. ${prefix}${cmd.name.padEnd(15)}│\n`;
            if (cmd.description) {
              responseText += `│     ${cmd.description.substring(0, 20).padEnd(15)}│\n`;
            }
          });
          
          responseText += `└─────────────────┘\n\n`;
          responseText += `💡 Click back button or send .menu again`;
        } else {
          responseText = `❌ No commands found in ${categoryName} category`;
        }
      }

      // Add back button
      const backButton = {
        text: responseText,
        footer: 'Click 🔙 to go back',
        buttons: [
          {
            buttonId: 'menu_back',
            buttonText: { displayText: '🔙 BACK TO MENU' },
            type: 1
          }
        ],
        headerType: 1,
        mentions: [sender]
      };

      await sock.sendMessage(extra.from, backButton, { quoted: extra.msg });

    } catch (error) {
      console.error('Button handler error:', error);
      await sock.sendMessage(extra.from, {
        text: `❌ Error: ${error.message}`
      }, { quoted: extra.msg });
    }
  }
};
