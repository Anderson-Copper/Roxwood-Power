const commands = [
  new SlashCommandBuilder()
    .setName('creer-embed')
    .setDescription('Test simple')
    .addStringOption(opt =>
      opt.setName('test').setDescription('champ test').setRequired(true)
    )
].map(cmd => cmd.toJSON());
