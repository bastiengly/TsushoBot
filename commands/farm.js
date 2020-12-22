const embedService = require("../services/embedService");
const rngService = require("../services/rngService");
const userModel = require("../models").sequelize.models.User;

const embed = (msg, args, count, userBalance, farmOutcomes) => {
  const message = `${rngService.getRandomArrayIndex(
    farmOutcomes[count.toString()]
  )}\n\nYou earned **${count}** Tsushobucks.\n\nYour total Tsushobuck balance is **${userBalance}**.`;
  return embedService.embedMessage(msg, args, message);
};

const count = async (msg, args, farmOutcomes) => {
  const authorId = msg.author.id;
  const user = await userModel.findOrCreateByDiscordId(authorId);
  const count = rngService.getRandomInt(1, 10);
  user.balance += count;
  await user.save().catch((err) => {
    console.error(err);
    return;
  });
  return embed(msg, args, count, user.balance, farmOutcomes);
};

module.exports = {
  name: "!farm",
  description: "Farm Tsushobucks.",
  execute(msg, args, options) {
    count(msg, args, options.constants.farmOutcomes);
  },
};
