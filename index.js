require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Carrega todos os comandos da pasta /commands automaticamente
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[AVISO] O comando em ${file} não possui "data" ou "execute".`);
  }
}

// Evento: bot ficou online
client.once('clientReady', () => {
  console.log(`✅ Bot online como ${client.user.tag}`);

  // Define o status (bolinha) e o texto de atividade do bot.
  // status pode ser: 'online', 'idle' (ausente), 'dnd' (não perturbe), 'invisible'
  client.user.setPresence({
    status: 'dnd', // não perturbe
    activities: [
      {
        name: 'nizim é gay', // texto que aparece: "Jogando stats do Hylex" (ou "Assistindo/Ouvindo", dependendo do type)
        type: 0, // 0=Jogando, 1=Transmitindo, 2=Ouvindo, 3=Assistindo, 5=Competindo
      },
    ],
  });

  // Confere os marcos de prestígio do clã a cada 2 minutos
  // (o bot Minecraft atualiza o arquivo topclan.json a cada 5 min, então
  // checar de 2 em 2 min garante que a gente não demora muito pra notificar)
  const { checarMarcos } = require('./modules/milestoneChecker');
  checarMarcos(client); // primeira checagem já ao iniciar
  setInterval(() => checarMarcos(client), 2 * 60 * 1000);
});

// Evento: recebendo uma interação (slash command)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`Comando não encontrado: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Erro ao executar ${interaction.commandName}:`, error);
    const errorMessage = { content: '❌ Ocorreu um erro ao executar este comando.', ephemeral: true };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);