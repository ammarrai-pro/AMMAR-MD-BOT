module.exports = {
  name: 'botweb',
  aliases: ['website', 'web', 'botlink'],
  category: 'general',
  description: 'Get AMMAR MD BOT WEBSITE',
  usage: '.botweb',
  
  async execute(sock, msg, args, extra) {
    await extra.reply(
      `🤖 *AMMAR MD BOT WEBSITE*\n\n` +
      `🌐 ${'='.repeat(30)}\n\n` +
      `https://ammar-md-bot.page.gd/\n\n` +
      `🌐 ${'='.repeat(30)}`
    );
  }
};
