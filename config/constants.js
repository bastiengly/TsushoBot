const fs = require("fs");
const constantsDir = "./config/constants";

/**
 * Reads and dynamically creates subsets of constants from configuration
 * files under constants/
 *
 * The constants configuration file names should follow the rules for valid variable names.
 * For the most strict asssociation use the command name as configuration file name
 * e.g.
 *  - colors.json
 *  - coinflip.json
 *  - count.json, etc.
 *
 * Constants are passed as a property of 'options'.
 * Ideally, depending on the structure, users would create subset caches
 * for easier access in their commands if needed:
 *
 * - const colors = options.constants.colors
 * - const weights = options.constants.game.weights
 */
class Constants {
  constructor() {
    // Get all constants configuration files
    let configs = fs.readdirSync(constantsDir);
    configs = configs.filter((e) => {
      return e.match(/.*\.json/gi);
    });

    // Attempt to join constants from configuration files
    for (const config of configs) {
      // Define the constant Property name based on the config file name
      let configProperty = config.split(".json").shift();

      const configPath = `${constantsDir}/${config}`;
      const data = JSON.parse(fs.readFileSync(configPath));

      try {
        // Make sure the property name is allowed
        if (Constants.isValidName(configProperty) === false) {
          throw `Invalid configuration constant name: ${configProperty} - this subset will be ignored.`;
        }

        // Dynamically create a new constant subset
        this[configProperty] = data;
      } catch (error) {
        console.error(`%c ${error}\n`, "background: #222; color: #BD0000");
      }
    }
  }

  /**
   * Checks if the given string can be used as a variable name
   *
   * is-var-name | ISC (c) Shinnosuke Watanabe
   * @see https://github.com/shinnn/is-var-name
   *
   * @return  {bool}
   */
  static isValidName = (str) => {
    if (typeof str !== "string") {
      return false;
    }

    if (str.trim() !== str) {
      return false;
    }

    try {
      new Function(str, "var " + str);
    } catch (_) {
      return false;
    }

    return true;
  };
}

module.exports = {
  constants: new Constants(),
};
