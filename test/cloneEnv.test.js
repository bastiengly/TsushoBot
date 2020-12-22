const expect = require("chai").expect;
const fs = require("fs");
const envClone = require("../scripts/cloneEnv");
const testRootDirectory = "test";
const envTestDir = "env";

/**
 * Change the current working directory to "test".
 * We have to be inside the testing environment
 * Tests already exist in the cloned repo, we don't have to check if it
 * exists since we are already running tests from this directory
 */
const changeWorkingDirectory = () => {
  try {
    process.chdir(testRootDirectory);
  } catch (error) {
    // Something bad happened :(
    // maybe the script was ran by `nobody`
    throw error;
  }
}

/**
 * Returns the current working directory path (the folder we are in)
 *
 * @return  {string}
 */
const checkWorkingDirectory = () => {
  // Take the last part of the working directory
  return process.cwd().split("\\").slice(-1)[0];
}

/**
 * Creates a testing environment directory, where the new .env will
 * be placed
 */
const createTestDir = () => {
  try {
    fs.mkdirSync(envTestDir);
  } catch (error) {
    // Re-throw if something happened
    if (error.code !== "EEXIST") {
      throw error;
    }

    // Do nothing if it already exists, we will remove this directory at the end
    // of the tests
  }
}

/**
 * Performs a cleanup after the test
 */
const deleteTestEnvDirectory = () => {
  let workingDirectory;

  try {
    // Make sure that working directory is set to "test"
    // The rmdir will not execute if we are located outside of the test directory
    workingDirectory = checkWorkingDirectory();
    if (workingDirectory !== testRootDirectory) {
      throw "Not in the working directory!!!";
    }

    fs.rmdirSync(envTestDir, { recursive: true });
  } catch (error) {
    // Re-throw to abort the test
    throw error;
  }
}

describe(".env Cloner", () => {
  /**
   * This should never happen, but sometimes we can remove the dev .env by accident :)
   */
  it ("should detect .env.copy", () => {
    // We are in the root at the moment
    const exists = fs.existsSync(".env.copy");

    expect(exists).to.deep.equal(true);
  });

  /**
   * Creates a test directory for new .env copy. We have to make sure that
   * we have writing permissions before we start testing the environment cloning
   * 
   * Since we are working with directory deletion, make sure that we are
   * in the test directory!!!
   */
  it ("should create a test folder (permissions test)", () => {
    // Step into /test
    changeWorkingDirectory();

    // Create a new directory if it does not exist
    // Initially, it should not exist, because we perform a cleanup after each test...
    let dirExists;

    // Create our new testing environment directory
    createTestDir();
    
    // Cache the existence at this point in test
    dirExists = fs.existsSync(envTestDir);

    // Cleanup
    let wasDirectoryDeleted;
    deleteTestEnvDirectory();

    wasDirectoryDeleted = !fs.existsSync(envTestDir);

    expect(dirExists).to.deep.equal(true, "Environment testing directory creation ('env/').") &&
    expect(wasDirectoryDeleted).to.deep.equal(true, "Environment testing directory deletion ('env/')");
  });

  /**
   * Finally, attempt to create a copy of the main .env.copy file.
   */
  it ("should create a copy of root .env.copy", () => {
    // We are already inside the "test" directory (changed by the previous test).
    // But since we are testing, we have to check it anyway and create one if needed
    if (checkWorkingDirectory() !== testRootDirectory) {
      changeWorkingDirectory();
    }

    // Prepare the environment
    createTestDir();

    // At this point, we are in the test directory, so we have to read
    // the buffer from parent directory
    const buffer = envClone.readMainEnv("..\\");

    // Create a new copy in the testing environment directory (/test/env/)
    envClone.clone(buffer, `${envTestDir}\\`, true);

    // Assertion point
    let newEnvExists = fs.existsSync(envTestDir);
    
    // Perform the same cleanup routine
    let wasDirectoryDeleted;
    deleteTestEnvDirectory();

    wasDirectoryDeleted = !fs.existsSync(envTestDir);

    expect(newEnvExists).to.deep.equal(true, "Environment clone creation") && 
    expect(wasDirectoryDeleted).to.deep.equal(true, "Environment testing directory deletion ('env/')");
  });

  /**
   * This will perform the same cloning test, except we will not allow overwriting.
   * To test this we have to call clone() twice to initially create one copy and
   * attempt to overwrite it in the second call
   */
  it ("should not overwrite the existing .env", () => {
    // Check the working directory again
    if (checkWorkingDirectory() !== testRootDirectory) {
      changeWorkingDirectory();
    }

    // Prepare the environment
    createTestDir();

    // At this point, we are in the test directory, so we have to read
    // the buffer from parent directory
    const buffer = envClone.readMainEnv("..\\");

    // Create a new copy in the testing environment directory (/test/env/)
    envClone.clone(buffer, `${envTestDir}\\`, false);

    // Assertion point - this time we have to check if the clone() function
    // returns false, as this informs about the existing file, suggesting --force argument
    let assertion = envClone.clone(buffer, `${envTestDir}\\`, false);

    // And again, perform the same cleanup routine
    let wasDirectoryDeleted;
    deleteTestEnvDirectory();

    wasDirectoryDeleted = !fs.existsSync(envTestDir);
    
    expect(assertion).to.deep.equal(false, "Clone overwrite attempt") && 
    expect(wasDirectoryDeleted).to.deep.equal(true, "Environment testing directory deletion ('env/')");
  });
});
