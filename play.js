const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from a YouTube URL, Spotify URL, or search term")
    .addStringOption((opt) =>
      opt.setName("query").setDescription("YouTube/Spotify URL or search term").setRequired(true)
    ),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ content: "❌ Join a voice channel first.", ephemeral: true });
    }

    const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has(["Connect", "Speak"])) {
      return interaction.reply({
        content: "❌ I need `Connect` and `Speak` permissions in that voice channel.",
        ephemeral: true,
      });
    }

    await interaction.deferReply();
    const query = interaction.options.getString("query", true);

    let player = client.lavalink.getPlayer(interaction.guild.id);
    if (!player) {
      player = client.lavalink.createPlayer({
        guildId: interaction.guild.id,
        voiceChannelId: voiceChannel.id,
        textChannelId: interaction.channel.id,
        selfDeaf: true,
        selfMute: false,
        volume: 100,
      });
    }

    if (!player.connected) await player.connect();

    // source only matters for plain search terms; URLs (YouTube or Spotify) are
    // auto-detected by Lavalink/LavaSrc regardless of this value.
    const res = await player.search({ query, source: "ytsearch" }, interaction.user);

    if (!res || res.loadType === "empty" || res.loadType === "error") {
      console.error("Search failed:", JSON.stringify({ query, loadType: res?.loadType, exception: res?.exception }, null, 2));
      const reason = res?.exception?.message ? ` (${res.exception.message})` : "";
      return interaction.editReply(`❌ No results found for **${query}**${reason}.`);
    }

    const embed = new EmbedBuilder().setColor(0x1db954);

    if (res.loadType === "playlist") {
      player.queue.add(res.tracks);
      embed.setDescription(
        `📃 Queued playlist **${res.playlist?.name ?? "Unknown"}** — ${res.tracks.length} tracks`
      );
    } else {
      const track = res.tracks[0];
      player.queue.add(track);
      embed.setDescription(`✅ Queued **[${track.info.title}](${track.info.uri})** by \`${track.info.author}\``);
    }

    if (!player.playing && !player.paused) await player.play();

    return interaction.editReply({ embeds: [embed] });
  },
};
