require("dotenv").config();
const Discord = require("discord.js");
const client = new Discord.Client();
client.commands = new Discord.Collection();
const botCommands = require("./commands");
const channelBindingService = require("./services/channelBindingService").ChannelBinding;
const constants = require("./config/constants").constants;

Object.keys(botCommands).map((key) => {
  client.commands.set(botCommands[key].name, botCommands[key]);
});

client.on("message", (msg) => {
  const args = msg.content.split(/ +/);
  const command = args.shift().toLowerCase();
  const options = {};

  if (!client.commands.has(command)) return;

  /**
   * Automatically checks if the requested command can be executed in the channel
   * this message came from.
   * 
   * This behavior ignores everything by default unless there is a binding specified 
   * between the __command name__ and __channel ID__.
   * 
   * Presence in the channel bindings (not in the environment!) means 
   * that commands can only be executed in specific channels.
   * 
   * This assumes a valid channel ID has been specified in the binding configuration, otherwise
   * the command will not get executed due to the channel ID mismatch
   */
  const boundCommand = new channelBindingService(msg, client.commands.get(command).name);
  if (boundCommand.belongsToThisChannel() === false) {
    // If needed, add console output informing about the command rejection
    return;
  }

  try {
    console.log(`called command: ${client.commands.get(command).name}`);
    if (command === "!help") options.commands = client.commands;
    options.constants = constants;
    client.commands.get(command).execute(msg, args, options);
  } catch (error) {
    console.error(error);
    msg.reply("Something broke and that last command did not work.");
  }
});

const TOKEN = process.env.TOKEN;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.login(TOKEN);
