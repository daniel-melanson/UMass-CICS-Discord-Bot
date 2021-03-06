import { Message } from "discord.js";

import { Command } from "Discord/commands/types";

export default {
	identifier: "invite",
	aliases: ["i"],
	group: "Utility",
	description: "Responds with a permanent invite to the discord.",
	examples: ["!invite"],
	guildOnly: true,
	func: async (message: Message) => {
		const guild = message.guild!;
		const general = guild.channels.cache.find(c => c.name === "general");
		if (!general) return message.reply("unable to find general channel. Make sure I can see that channel.");

		const invite = await general.createInvite({
			maxAge: 0,
		});

		return message.reply(`here is a permanent invite to this discord: ${invite.toString()}`);
	},
} as Command;
