require('dotenv').config();
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

async function fetchAllImages(channel) {
  console.log("🔍 Starter med at hente beskeder...");
  const images = [];
  let lastMessageId = null;
  let messageCount = 0;

  while (true) {
    const options = { limit: 100 };
    if (lastMessageId) options.before = lastMessageId;

    console.log(`📥 Henter beskeder${lastMessageId ? ` før ID ${lastMessageId}` : ''}...`);
    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) {
      console.log("✅ Ingen flere beskeder.");
      break;
    }

    messageCount += messages.size;
    console.log(`➡️  Hentede ${messages.size} beskeder (i alt: ${messageCount})`);

    messages.forEach(msg => {
      msg.attachments.forEach(att => {
        const isImageType = att.contentType?.startsWith('image/');
        const isImageName = att.name?.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/);

        if (isImageType || isImageName) {
          console.log(`🖼️ Billede fundet: ${att.url}`);
          images.push(att.url);
        }
      });
    });

    lastMessageId = messages.last()?.id;
    if (messages.size < 100) {
      console.log("📦 Nåede enden af kanalhistorikken.");
      break;
    }
  }

  console.log(`🎯 Færdig. Beskeder læst: ${messageCount}, Billeder fundet: ${images.length}`);
  return images;
}

client.once('ready', async () => {
  console.log(`✅ Logget ind som ${client.user.tag}`);

  try {
    const oldChannel = await client.channels.fetch(OLD_CHANNEL_ID);
    const newChannel = await client.channels.fetch(NEW_CHANNEL_ID);

    console.log("📂 Kanaler hentet. Starter billedsøgning...");

    const images = await fetchAllImages(oldChannel);
    if (images.length > 0) {
      const selected = images[Math.floor(Math.random() * images.length)];
      console.log(`🎲 Tilfældigt billede valgt: ${selected}`);

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
      console.log(`✅ Billede sendt til #${newChannel.name}`);
    } else {
      console.log("❌ Ingen billeder fundet i kanalen.");
    }
  } catch (err) {
    console.error("🚨 Fejl under udførsel:", err);
  }

  client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
