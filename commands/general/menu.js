/**
 * COMPLETE MENU COMMAND - ALL COMMANDS INCLUDED
 * Shows every single command without missing any
 */

const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'menu',
  aliases: ['help', 'commands', 'allcmds', 'cmdlist'],
  category: 'general',
  description: '📋 Complete menu with all commands',
  usage: '.menu',

  async execute(sock, msg, args, extra) {
    try {
      const commands = loadCommands();
      const categories = {};
      const userTag = extra.sender.split('@')[0];
      const prefix = config.prefix || '.';
      const botName = config.botName || '✨ BOT ✨';
      
      // Group ALL commands by category (NO COMMAND MISSING)
      commands.forEach((cmd, name) => {
        // Only add main command name, not aliases
        if (cmd.name === name) {
          if (!categories[cmd.category]) categories[cmd.category] = [];
          categories[cmd.category].push(cmd);
        }
      });
      
      // Count total unique commands
      let totalUniqueCommands = 0;
      for (const cat in categories) {
        totalUniqueCommands += categories[cat].length;
      }
      
      // Store session
      if (!global.menuSessions) global.menuSessions = new Map();
      global.menuSessions.set(extra.sender, {
        categories: categories,
        prefix: prefix,
        allCommands: commands,
        totalCommands: totalUniqueCommands,
        timestamp: Date.now()
      });

      const action = args[0]?.toLowerCase();
      
      if (action === 'all') {
        await showAllCommandsComplete(sock, extra, categories, prefix, totalUniqueCommands);
      } 
      else if (action === 'list') {
        await showSimpleCommandList(sock, extra, categories, prefix);
      }
      else if (action && categories[action]) {
        await showCategoryWithAllCommands(sock, extra, action, categories, prefix);
      }
      else {
        await showMainMenuComplete(sock, msg, extra, { categories, prefix, botName, userTag, commands, totalUniqueCommands });
      }

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

      const { categories, prefix, totalCommands } = session;

      if (buttonId === 'menu_back') {
        const botName = config.botName || '✨ BOT ✨';
        const userTag = sender.split('@')[0];
        await showMainMenuComplete(sock, extra.msg, extra, {
          categories: categories,
          prefix: prefix,
          botName: botName,
          userTag: userTag,
          totalCommands: totalCommands
        });
      }
      else if (buttonId === 'menu_all') {
        await showAllCommandsComplete(sock, extra, categories, prefix, totalCommands);
      }
      else if (buttonId === 'menu_list') {
        await showSimpleCommandList(sock, extra, categories, prefix);
      }
      else {
        const categoryId = buttonId.replace('menu_', '');
        await showCategoryWithAllCommands(sock, extra, categoryId, categories, prefix);
      }

    } catch (error) {
      console.error('Button handler error:', error);
      await sock.sendMessage(extra.from, {
        text: `❌ Error: ${error.message}`
      }, { quoted: extra.msg });
    }
  }
};

// ==================== MAIN MENU WITH ALL CATEGORIES ====================

async function showMainMenuComplete(sock, msg, extra, { categories, prefix, botName, userTag, totalCommands }) {
  
  // Get all categories that have commands
  const availableCategories = [];
  const categoryIcons = {
    general: '📌', ai: '🤖', group: '👥', owner: '⚙️',
    media: '🎥', fun: '🎮', utility: '🔧', anime: '🎌', 
    textmaker: '✍️', download: '📥', educational: '📚', 
    islamic: '🕌', tools: '🛠️', game: '🎯', nsfw: '🔞'
  };
  
  for (const [cat, cmds] of Object.entries(categories)) {
    if (cmds && cmds.length > 0) {
      availableCategories.push({
        id: `menu_${cat}`,
        name: `${categoryIcons[cat] || '📁'} ${cat.toUpperCase()}`,
        count: cmds.length
      });
    }
  }
  
  // Build main menu text
  let menuText = `✨ *${botName}* ✨\n\n`;
  menuText += `👋 Hello *@${userTag}*\n`;
  menuText += `📝 Prefix: \`${prefix}\`\n`;
  menuText += `⚡ Total Commands: *${totalCommands}*\n`;
  menuText += `📂 Categories: *${availableCategories.length}*\n\n`;
  menuText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menuText += `*📋 AVAILABLE CATEGORIES:*\n\n`;
  
  // List all categories with command counts
  for (const cat of availableCategories) {
    menuText += `▸ ${cat.name.replace('menu_', '')} - *${cat.count}* commands\n`;
  }
  
  menuText += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  menuText += `💡 *Quick Commands:*\n`;
  menuText += `• \`${prefix}menu all\` - Show EVERY command\n`;
  menuText += `• \`${prefix}menu list\` - Simple command list\n`;
  menuText += `• \`${prefix}menu <category>\` - Category commands\n\n`;
  menuText += `👇 *Click button to view commands:*`;
  
  // Create buttons (max 3 per row)
  const buttons = [];
  for (let i = 0; i < availableCategories.length; i += 3) {
    const row = availableCategories.slice(i, i + 3);
    for (const btn of row) {
      buttons.push({
        buttonId: btn.id,
        buttonText: { displayText: btn.name.substring(0, 20) },
        type: 1
      });
    }
  }
  
  // Add special buttons
  buttons.push(
    { buttonId: 'menu_all', buttonText: { displayText: '📋 ALL COMMANDS' }, type: 1 },
    { buttonId: 'menu_list', buttonText: { displayText: '📝 SIMPLE LIST' }, type: 1 }
  );
  
  await sock.sendMessage(extra.from, {
    text: menuText,
    footer: `🤖 ${totalCommands} Total Commands`,
    buttons: buttons,
    mentions: [extra.sender]
  }, { quoted: msg });
}

// ==================== SHOW ALL COMMANDS (COMPLETE LIST) ====================

async function showAllCommandsComplete(sock, extra, categories, prefix, totalCommands) {
  let responseText = `📋 *COMPLETE COMMAND LIST*\n`;
  responseText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  responseText += `📝 Total: *${totalCommands}* commands\n`;
  responseText += `🔰 Prefix: \`${prefix}\`\n`;
  responseText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Order of categories
  const categoryOrder = ['general', 'ai', 'group', 'owner', 'media', 'fun', 'utility', 'anime', 'textmaker', 'download', 'educational', 'islamic', 'tools', 'game', 'nsfw'];
  
  let commandNumber = 1;
  
  for (const cat of categoryOrder) {
    const cmdList = categories[cat];
    if (cmdList && cmdList.length > 0) {
      // Category header
      responseText += `▸ *${cat.toUpperCase()}* (${cmdList.length} commands)\n`;
      responseText += `  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      
      // List ALL commands in this category
      for (const cmd of cmdList) {
        responseText += `  ${commandNumber.toString().padStart(3)}. \`${prefix}${cmd.name}\``;
        if (cmd.description) {
          responseText += ` - ${cmd.description.substring(0, 40)}`;
        }
        responseText += `\n`;
        commandNumber++;
      }
      responseText += `\n`;
    }
  }
  
  responseText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  responseText += `✅ Total *${commandNumber - 1}* commands shown\n`;
  responseText += `💡 Use \`${prefix}help <command>\` for details`;
  
  // Split into multiple messages if too long (WhatsApp limit ~65k chars)
  if (responseText.length > 60000) {
    const parts = responseText.match(/[\s\S]{1,60000}/g) || [];
    for (let i = 0; i < parts.length; i++) {
      let partText = parts[i];
      if (i === 0) {
        // First part already has header
      } else {
        partText = `📋 *COMMAND LIST (Part ${i + 1})*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${partText}`;
      }
      
      const buttons = i === parts.length - 1 ? [
        { buttonId: 'menu_back', buttonText: { displayText: '🔙 Back to Menu' }, type: 1 }
      ] : [];
      
      await sock.sendMessage(extra.from, {
        text: partText,
        buttons: buttons
      }, { quoted: extra.msg });
    }
  } else {
    await sock.sendMessage(extra.from, {
      text: responseText,
      buttons: [
        { buttonId: 'menu_back', buttonText: { displayText: '🔙 Back to Menu' }, type: 1 }
      ]
    }, { quoted: extra.msg });
  }
}

// ==================== SHOW SIMPLE COMMAND LIST (JUST NAMES) ====================

async function showSimpleCommandList(sock, extra, categories, prefix) {
  let responseText = `📝 *COMMAND LIST (Simple)*\n`;
  responseText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  const categoryOrder = ['general', 'ai', 'group', 'owner', 'media', 'fun', 'utility', 'anime', 'textmaker'];
  
  for (const cat of categoryOrder) {
    const cmdList = categories[cat];
    if (cmdList && cmdList.length > 0) {
      responseText += `✦ *${cat.toUpperCase()}*\n`;
      const cmdNames = cmdList.map(cmd => `\`${prefix}${cmd.name}\``).join('  •  ');
      responseText += `  ${cmdNames}\n\n`;
    }
  }
  
  responseText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  responseText += `💡 Send \`${prefix}menu all\` for detailed list`;
  
  await sock.sendMessage(extra.from, {
    text: responseText,
    buttons: [
      { buttonId: 'menu_all', buttonText: { displayText: '📋 Detailed List' }, type: 1 },
      { buttonId: 'menu_back', buttonText: { displayText: '🔙 Back' }, type: 1 }
    ]
  }, { quoted: extra.msg });
}

// ==================== SHOW CATEGORY WITH ALL ITS COMMANDS ====================

async function showCategoryWithAllCommands(sock, extra, categoryId, categories, prefix) {
  const cmdList = categories[categoryId];
  
  const categoryNames = {
    general: '📌 GENERAL COMMANDS', ai: '🤖 AI COMMANDS',
    group: '👥 GROUP COMMANDS', owner: '⚙️ OWNER COMMANDS',
    media: '🎥 MEDIA COMMANDS', fun: '🎮 FUN COMMANDS',
    utility: '🔧 UTILITY COMMANDS', anime: '🎌 ANIME COMMANDS',
    textmaker: '✍️ TEXTMAKER COMMANDS', download: '📥 DOWNLOAD COMMANDS',
    educational: '📚 EDUCATIONAL COMMANDS', islamic: '🕌 ISLAMIC COMMANDS',
    tools: '🛠️ TOOLS COMMANDS', game: '🎯 GAME COMMANDS', nsfw: '🔞 NSFW COMMANDS'
  };
  
  const categoryName = categoryNames[categoryId] || `${categoryId.toUpperCase()} COMMANDS`;
  
  if (!cmdList || cmdList.length === 0) {
    await sock.sendMessage(extra.from, {
      text: `❌ No commands found in *${categoryName}*`
    }, { quoted: extra.msg });
    return;
  }
  
  let responseText = `📁 *${categoryName}*\n`;
  responseText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  responseText += `📝 Total: *${cmdList.length}* commands\n`;
  responseText += `🔰 Prefix: \`${prefix}\`\n`;
  responseText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  // Show EVERY command in this category with details
  cmdList.forEach((cmd, idx) => {
    responseText += `${(idx + 1).toString().padStart(2)}. *${prefix}${cmd.name}*\n`;
    if (cmd.description) {
      responseText += `   📌 ${cmd.description}\n`;
    }
    if (cmd.aliases && cmd.aliases.length > 0) {
      responseText += `   🔄 Aliases: ${cmd.aliases.join(', ')}\n`;
    }
    if (cmd.usage && cmd.usage !== cmd.name) {
      responseText += `   📝 Usage: ${cmd.usage}\n`;
    }
    responseText += `\n`;
  });
  
  responseText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  responseText += `✅ Total *${cmdList.length}* commands in this category`;
  
  await sock.sendMessage(extra.from, {
    text: responseText,
    buttons: [
      { buttonId: 'menu_all', buttonText: { displayText: '📋 All Commands' }, type: 1 },
      { buttonId: 'menu_back', buttonText: { displayText: '🔙 Back to Menu' }, type: 1 }
    ]
  }, { quoted: extra.msg });
}
