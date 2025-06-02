require('./keep_alive');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const OLD_CHANNEL_ID = process.env.OLD_CHANNEL_ID;
const NEW_CHANNEL_ID = process.env.NEW_CHANNEL_ID;
const TOKEN = process.env.DISCORD_TOKEN;

async function fetchAllImages(channel) {
  const images = [];
  let lastMessageId = null;

  while (true) {
    const options = { limit: 100 };
    if (lastMessageId) options.before = lastMessageId;

    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) break;

    messages.forEach(msg => {
      msg.attachments.forEach(att => {
        const isImageType = att.contentType?.startsWith('image/');
        const isImageName = att.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);
        if (isImageType || isImageName) {
          images.push(att.url);
        }
      });
    });

    lastMessageId = messages.last()?.id;
    if (messages.size < 100) break;
  }

  return images;
}

async function postNostalgiaImage() {
  try {
    const oldChannel = await client.channels.fetch(OLD_CHANNEL_ID);
    const newChannel = await client.channels.fetch(NEW_CHANNEL_ID);
    const images = await fetchAllImages(oldChannel);

    if (images.length > 0) {
      const selected = images[Math.floor(Math.random() * images.length)];
      const today = new Date();
      const formattedDate = today.toLocaleDateString('da-DK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const embed = new EmbedBuilder()
        .setTitle(`🕰️ Dagens nostalgi — ${formattedDate}`)
        .setImage(selected);

      await newChannel.send({ embeds: [embed] });
      console.log(`✅ Billede sendt: ${selected}`);
    } else {
      console.log("❌ Ingen billeder fundet.");
    }
  } catch (err) {
    console.error("🚨 Fejl:", err);
  }
}

client.once('ready', async () => {
  console.log(`✅ Logget ind som ${client.user.tag}`);
  while (true) {
    await postNostalgiaImage();
    console.log("⏳ Venter 24 timer...");
    await new Promise(resolve => setTimeout(resolve, 24 * 60 * 60 * 1000)); // 24h
  }
});

client.login(TOKEN);
