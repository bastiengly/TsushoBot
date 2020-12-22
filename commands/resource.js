const embedService = require("../services/embedService");
const db = require("../models").sequelize;
const userModel = db.models.User;
const mediaModel = db.models.Media;
const mime = require("mime-types");
const axios = require("axios").default;
const approverRole = process.env.hasOwnProperty("APPROVER_ROLE")
  ? process.env.APPROVER_ROLE
  : "Moderator";
require("../services/channelBindingService").ChannelBinding;

const URLExists = async (url) => {
  try {
    await axios.head(url);
    return true;
  } catch {
    return false;
  }
};

const checkURL = (url) => {
  const pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
  return pattern.test(url);
};

const checkResource = async (resource) => {
  const exists = await URLExists(resource);
  if (checkURL(resource) && exists) {
    return mime.lookup(resource);
  }
};

const addResource = async (msg, args, options) => {
  const commandNames = options.commandNames;
  const user = await userModel.findOrCreateByDiscordId(msg.author.id);
  const passedCommand = args[0];
  const passedResource = args[1];
  if (user.whitelisted && commandNames.includes(passedCommand)) {
    msg.delete();
    const resourceExists = await mediaModel.findOneByMediaContent(
      passedResource
    );
    const resourceValid = await checkResource(passedResource);
    if (resourceValid && !resourceExists) {
      const media = mediaModel.build({
        mediaContent: passedResource,
        requestedByUserId: user.discordId,
        commandName: passedCommand,
      });

      let message;
      msg.member.roles.cache.some((role) => role.name === approverRole)
        ? (media.approved = true)
        : (media.approved = false);
      await media.save().catch((err) => {
        console.error(err);
        return;
      });

      media.approved
        ? (message = "Successfully added the resource.")
        : (message = "Successfully added the resource for approval.");
      return embedService.embedMessage(msg, args, message);
    } else {
      const message = "The resource cannot be added.";
      return embedService.embedMessage(msg, args, message);
    }
  }
};

module.exports = {
  name: "!resource",
  description: "Add a resource for approval.",
  execute(msg, args, options = {}) {
    addResource(msg, args, options.constants.media);
  },
};
