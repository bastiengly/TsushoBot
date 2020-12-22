const db = require("../models").sequelize;
const mediaModel = db.models.Media;

const getResource = async (msg) => {
  const resource = await mediaModel
    .selectRandomFromCommand("alk")
    .catch((err) => console.error(err));
  return msg.channel.send(resource.mediaContent).catch(async (err) => {
    console.error(err);
    await resource.destroy.catch((error) => {
      console.error(error);
      return;
    });
    const embedMessage = `Encountered an invalid resource - it has now been removed.`;
    return embedService.embedMessage(msg, args, embedMessage);
  });
};

module.exports = {
  name: "!alk",
  description: "Posts a random Alkaizer.",
  execute(msg, args, options = {}) {
    getResource(msg);
  },
};
