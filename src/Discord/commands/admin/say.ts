import { Message } from "discord.js";

import { Command, UserPermission } from "Discord/commands/types";

export default {
	identifier: "say",
	group: "Administrative",
	description: "Repeats a supplied message.",
	examples: ["!say Hello"],
	guildOnly: true,
	userPermission: UserPermission.Moderator,
	parameters: [
		{
			name: "msg",
			type: "string",
			prompt: "what would you like me to say?",
			matchGroupIndex: 2,
		},
	],
	func: async (message: Message, result: { msg: string }) => {
		await message.delete();
		return message.channel.send(result.msg);
	},
} as Command;
