const {
    SlashCommandBuilder
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("role")
        .setDescription("Adiciona ou remove um cargo.")
        .addStringOption(option =>
            option
                .setName("acao")
                .setDescription("add ou remove")
                .setRequired(true)
                .addChoices(
                    { name: "add", value: "add" },
                    { name: "remove", value: "remove" }
                )
        )
        .addStringOption(option =>
            option
                .setName("cargo")
                .setDescription("Nome do cargo")
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName("membro")
                .setDescription("ID do membro")
                .setRequired(true)
        ),

    async execute(interaction) {
        const acao = interaction.options.getString("acao");
        const cargoNome = interaction.options.getString("cargo");
        const membroId = interaction.options.getString("membro");

        const role = interaction.guild.roles.cache.find(
            r => r.name.toLowerCase() === cargoNome.toLowerCase()
        );

        if (!role)
            return interaction.reply({
                content: "❌ Cargo não encontrado.",
                ephemeral: true
            });

        const member = await interaction.guild.members.fetch(membroId).catch(() => null);

        if (!member)
            return interaction.reply({
                content: "❌ Membro não encontrado.",
                ephemeral: true
            });

        try {
            if (acao === "add") {
                await member.roles.add(role);
                return interaction.reply({
                    content: `✅ Cargo **${role.name}** adicionado para ${member.user.tag}.`,
                    ephemeral: true
                });
            }

            await member.roles.remove(role);

            return interaction.reply({
                content: `✅ Cargo **${role.name}** removido de ${member.user.tag}.`,
                ephemeral: true
            });

        } catch (err) {
            console.error(err);

            return interaction.reply({
                content: "❌ Não foi possível alterar o cargo.",
                ephemeral: true
            });
        }
    }
};