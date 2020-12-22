const embedService = require("../services/embedService");
const rngService = require("../services/rngService");
const models = require("../models").sequelize.models;
const userModel = models.User;
const betModel = models.Bet;

const gamble = async (msg, args, outcomes) => {
  const user = await userModel.findOrCreateByDiscordId(msg.author.id);
  let value = parseInt(args[0]);
  if (args[0] === "all") value = user.balance;
  let message;
  if (value > 0) {
    if (value <= user.balance) {
      const outcome = rngService.getRandomInt(0, 1);
      if (outcome === 0) {
        const winnings = Math.ceil(value * 0.99);
        user.balance += winnings;
        const outcomeMessage = rngService.getRandomArrayIndex(outcomes["win"]);
        message = [
          `${outcomeMessage} **You won!**`,
          `You earned **${winnings}** Tsushobucks.`,
          `Your new balance is **${user.balance}**.`,
        ].join("\n\n");
      } else {
        user.balance -= value;
        const outcomeMessage = rngService.getRandomArrayIndex(outcomes["loss"]);
        message = [
          `${outcomeMessage} **You lost.**`,
          `You lost **${value}** Tsushobucks.`,
          `Your new balance is **${user.balance}**.`,
        ].join("\n\n");
      }
      await user.save().catch((err) => {
        console.error(err);
        return;
      });
      await betModel
        .create({
          userId: user.id,
          outcome,
          amount: outcome === 0 ? Math.ceil(value * 0.99) : value,
        })
        .catch((err) => {
          console.error(err);
          return;
        });
    } else {
      message = "You can't bet more Tsushobucks than you have.";
    }
  } else {
    message = "You didn't enter a valid amount.";
  }
  return embedService.embedMessage(msg, args, message);
};

module.exports = {
  name: "!gamble",
  description: "See if you can win some Tsushobucks quick.",
  execute(msg, args, options) {
    gamble(msg, args, options.constants.gambleOutcomes);
  },
};
