const fs = require("fs");

const envLocation = ".env.copy";

/**
 * Returns the contents of .env.copy for file cloning
 *
 * @param   {string}  pathPrefix  Provide when reading from different directory
 *
 * @return  {Buffer|undefined}
 */
const readMainEnv = (pathPrefix = "") => {
  if (fs.existsSync(pathPrefix + envLocation) === false) {
    return 'undefined';
  }
  
  return fs.readFileSync(pathPrefix + envLocation);
}

/**
 * Creates a new .env from .env.copy
 *
 * @param   {Buffer}    mainEnv       Contents of .env.copy
 * @param   {string}    pathPrefix    Path prefix - provide when reading from a different directory
 * @param   {boolean}   force         If true, will overwrite the existing .env
 *
 * @return  {boolean}
 */
const clone = (mainEnv, pathPrefix = "", force = false) => {
  if (mainEnv === "undefined") {
    throw ".env.copy does not exist";
  }

  // Abort if the .env already exists unless we have __force__ parameter set to true
  if (fs.existsSync(`${pathPrefix}.env`) === true && force === false) {
    console.error(`%c .env already exists! Use "npm run cloneEnv -- --force" to overwrite the existing file.\n--- Ignore if this output is a part of testing. ---`, 'background: #222; color: #BD0000');
    return false;
  }

  fs.writeFileSync(`${pathPrefix}.env`, mainEnv);
  return true;
}

// CLI-related - used when called by npm run cloneEnv
if (process.argv.includes("--clone")) {
  // We don't override the path from CLI
  const forceCloning = process.argv.includes("--force");
  
  const buffer = readMainEnv();
  clone(buffer, "", forceCloning);
}

module.exports = {
  readMainEnv,
  clone,
}
