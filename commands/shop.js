const embedService = require("../services/embedService");
const fishService = require("../services/fishService");
const db = require("../models").sequelize;

const fishermanModel = db.models.Fisherman;

const embed = (msg, args, user) => {
  const author = {
    name: `The Shop`,
    icon_url: `${msg.author.avatarURL()}`,
  };
  const argsTitle = true;
  let allItems = fishService.getAllItems();
  let fields = [];
  allItems.forEach((item) =>
    fields.push({
      name: `${item.id}. ${item.name}`,
      value: eval("!user." + item.userp)
        ? `**${item.price}** Tsushobucks \n${item.flvrshop}`
        : `:white_check_mark: You own this item`,
    })
  );

  fields.forEach((field, i) => {
    fields[i].inline = true;
  });
  return embedService.embed(msg, args, {
    author,
    argsTitle,
    fields,
  });
};

const shop = async (msg, args) => {
  const fisherman = await fishermanModel.findOrCreateByDiscordId(msg.author.id);
  await fisherman.save().catch((err) => {
    console.error(err);
    return;
  });
  return embed(msg, args, fisherman);
};

module.exports = {
  name: "!shop",
  description: "Spend your Tsushobucks here",
  execute(msg, args, options = {}) {
    shop(msg, args);
  },
};
