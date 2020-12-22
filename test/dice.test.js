const expect = require("chai").expect;

// Load Constants and the Game class 
const Dice = require("../commands/classes/Dice").Dice;
const constants = require("../config/constants").constants;

// Cache messages from game constants
const diceMessages = constants.dice.messages;

// We can work on a single instance since we are constantly
// changing the rolls and message only. We also have to mock
// a message owner (message.author.username)
const mockMessage = { author: { username: "test_user" } };
const dice = new Dice(constants.dice, mockMessage);

describe ("Dice", () => {
  /**
   * We have to make sure our constants are actually loaded, they exist
   * and the default keys are present
   */
  describe ("Constants", () => {
    describe ("Constants presence", () => {
      it ("should have default constants file created", () => {
        expect(constants.dice).to.not.deep.equal("undefined");
      });
    });
    
    describe ("Constants integrity", () => {
      it ("should contain game default constants: 'timeBeforeNextRound', 'pointsRequired', 'points', 'messages', 'colors'", () => {
        // These are the game constants that should exist by default
        const requiredKeys = [
          "timeBeforeNextRound",
          "pointsRequired",
          "points",
          "messages",
          "colors"
        ];

        // Make sure that current keys present in the constants implement
        // the default (required) keys. 
        const currentKeys = Object.keys(constants.dice);
        
        const assertion = requiredKeys.every( (element) => {
          return currentKeys.includes(element);
        });

        expect(assertion).to.deep.equal(true);
      });
    });
  });

  /**
   * Check if the game can properly detect specific combinations in
   * a set of some forced rolls
   */
  describe ("Dice roll rules", () => {
    it ("should detect 'nothing special'   in [2, 4, 4, 1, 5]", () => {
      // Force no combinations
      dice.diceRolls = [2, 4, 4, 1, 5].sort();
      dice.detectAppliedRule();

      // After we walked through the game rules detection,
      // the outcome is stored as a message and points.
      // We only have to check for the specific message
      expect(dice.rollMessage).to.deep.equal(diceMessages.nothing);
    });

    it ("should detect 'a Three of a kind' in [4, 3, 4, 2, 4]", () => {
      dice.diceRolls = [4, 3, 4, 2, 4].sort();
      dice.detectAppliedRule();

      expect(dice.rollMessage).to.deep.equal(diceMessages.three_of_a_kind);
    });

    it ("should detect 'a Four of a kind'  in [1, 6, 1, 1, 1]", () => {
      dice.diceRolls = [1, 6, 1, 1, 1].sort();
      dice.detectAppliedRule();

      expect(dice.rollMessage).to.deep.equal(diceMessages.four_of_a_kind);
    });

    it ("should detect 'a Full House'      in [2, 5, 2, 5, 2]", () => {
      dice.diceRolls = [2, 5, 2, 5, 2].sort();
      dice.detectAppliedRule();

      expect(dice.rollMessage).to.deep.equal(diceMessages.full_house);
    });

    it ("should detect 'a low Straight'    in [4, 3, 2, 5, 1]", () => {
      dice.diceRolls = [4, 3, 2, 5, 1].sort();
      dice.detectAppliedRule();

      expect(dice.rollMessage).to.deep.equal(diceMessages.straight_low);
    });

    it ("should detect 'a high Straight'   in [6, 4, 3, 5, 2]", () => {
      dice.diceRolls = [6, 4, 3, 5, 2].sort();
      dice.detectAppliedRule();

      expect(dice.rollMessage).to.deep.equal(diceMessages.straight_high);
    });

    it ("should detect 'a Flush'           in [3, 3, 3, 3, 3]", () => {
      dice.diceRolls = [3, 3, 3, 3, 3].sort();
      dice.detectAppliedRule();

      expect(dice.rollMessage).to.deep.equal(diceMessages.flush);
    });

    it ("should __NOT__ detect 'a Three of a kind' before 'Full House' in [2, 5, 2, 5, 2]", () => {
      // Full House takes precedence ofer Three of a Kind, so we have to
      // make sure the rule check breaks properly
      dice.diceRolls = [2, 5, 5, 2, 2].sort();
      dice.detectAppliedRule();

      expect(dice.rollMessage).to.not.deep.equal(diceMessages.three_of_a_kind);
    });
  });

  describe ("Game Points contribution", () => {
    /**
     * This time we care about the points, so we have to clear the awarded points
     * from the previous tests
     */
    it ("should award points for 'ones' and 'fives' properly (25 points for [4, 1, 5, 6, 1])", () => {
      dice.amountOfPointsThisRound = 0;

      // Each "One" is worth 10 points by default, each "Five" is worth 5 points
      // These rolls should award 25 points
      dice.diceRolls = [4, 1, 5, 6, 1].sort();
      dice.detectAppliedRule();

      expect(dice.amountOfPointsThisRound).to.deep.equal(25);
    });

    it ("should add a new contributor", () => {
      // Assuming this user has rolled a Flush
      // Clear the points/contributors from previous tests
      dice.amountOfPointsThisRound = 0;
      Dice.contributors = {}; // static

      dice.diceRolls = [1, 1, 1, 1, 1];
      dice.detectAppliedRule();

      Dice.addContribution(dice.msg.author.username, dice.amountOfPointsThisRound);

      // Compare it to the mocked up user rolling a flush for 300 points
      const user = mockMessage.author.username
      expect(Dice.contributors).to.deep.equal({
        [user]: dice.pointsTable.flush
      });
    });
  });

  describe ("Game rules", () => {
    /**
     * By default, there is a 10 seconds timeout before players can execute
     * another dice command. The test should detect if the game has been set
     * as `notStartedYet` to false in the beginning and true after that delay
     */
    it ("should lock the game after restarting", async () => {
      // We have to override the game queue time to not wait 10 seconds by default
      Dice.queueTime = 0.005;
      
      // When we enqueue a new game, the "hasStartedYet" property is set to false
      // to make sure we can't execute the !dice command
      Dice.restartGame();
      let initialGameState = Dice.hasStartedYet;

      let gameStatePromise = new Promise( (resolve, reject) => {
        setTimeout(() => {
          resolve(Dice.hasStartedYet);
        }, (Dice.queueTime * 1000));
      });

      // After the game has been restarted, the "hasStartedYet" property 
      // is set to true indicating the !dice command is available again
      const postGameState = await gameStatePromise;
      const assertion = initialGameState === false && postGameState === true;
      
      expect(assertion).to.deep.equal(true);
    });
  });
});


