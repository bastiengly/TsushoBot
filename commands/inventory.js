const embedService = require("../services/embedService");
const db = require("../models").sequelize;

const fishermanModel = db.models.Fisherman;

const embed = (msg, args, user) => {
  const argsTitle = true;
  const author = {
    name: `${msg.author.username}'s inventory`,
    icon_url: `${msg.author.avatarURL()}`,
  };
  const fields = [
    {
      name: ":motorized_wheelchair:",
      value: `**${user.motorized_wheelchair}**`,
    },
    {
      name: ":manual_wheelchair:",
      value: `**${user.manual_wheelchair}**`,
    },
    {
      name: ":heart:",
      value: `**${user.heart}**`,
    },
    {
      name: ":wrench:",
      value: `**${user.wrench}**`,
    },
    {
      name: ":boot:",
      value: `**${user.boot}**`,
    },
    {
      name: ":fish:",
      value: `**${user.fish}**`,
    },
    {
      name: ":tropical_fish:",
      value: `**${user.tropical_fish}**`,
    },
    {
      name: ":blowfish:",
      value: `**${user.blowfish}**`,
    },
    {
      name: ":yen:",
      value: `**${user.User.balance}**`,
    },
    {
      name: "\u200b",
      value: `Your current inventory is worth **${user.getValueOfInv()}** Tsushobucks`,
    },
  ];
  fields.forEach((field, i) => {
    fields[i].inline = true;
  });
  return embedService.embed(msg, args, {
    author,
    argsTitle,
    fields,
  });
};

const inventory = async (msg, args) => {
  const fisherman = await fishermanModel.findOrCreateByDiscordId(msg.author.id);
  await fisherman.save().catch((err) => {
    console.error(err);
    return;
  });
  return embed(msg, args, fisherman);
};

module.exports = {
  name: "!inventory",
  description: "Shows your fish inventory.",
  execute(msg, args, options = {}) {
    inventory(msg, args);
  },
};
