client.on('messageCreate', async message => {
  if (message.channelId === '1375152581307007056' && message.content === '1') {
    const consoChannel = await client.channels.fetch('1374906428418031626');
    if (consoChannel && consoChannel.isTextBased()) {
      await consoChannel.send('0');
      console.log('✅ Test réussi : le bot a bien répondu 0 dans conso');
    } else {
      console.warn('⚠️ Salon conso introuvable ou non textuel');
    }
  }
});


