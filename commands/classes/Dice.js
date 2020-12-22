const rngService = require("../../services/rngService");
const _ = require("lodash");

/**
 * Super-simplified Dice 1000 game (extended to 10000)
 * A DB-less mini-game.
 * 
 * @var {object}
 */
class Dice {
  /**
   * Total game points in the current round. This value will be updated with each roll
   * as long as the bot is running.
   *
   * @var {integer}
   */
  static points = 0;

  /**
   *  If this flag is set to true, the game ends and the bot outputs the leaderboard
   *
   * @var {bool}
   */
  static gameFinished = false;

  /**
   * A list of contributors in the current round of the game
   *
   * @var {object}
   */
  static contributors = {};

  /**
   * By default, the game is set as started. Once finished, the game will enqueue the next round.
   * When false, this flag prevents the command execution
   *
   * @var {bool}
   */
  static hasStartedYet = true;

  /**
   * Time before the next round can be started - set by the constructor
   *
   * @var {integer}
   */
  static gameQueueTime = 0;

  /**
   * Emoji reserved for the first three winners.
   * First element has to be empty so we don't have to modify the loop index
   *
   * @var {array}
   */
  static medals = [
    ,
    ":first_place:",
    ":second_place:",
    ":third_place:"
  ];

  /**
   * Enqueues the new game. After the certain delay has passed, 
   * the command will be available for execution
   *
   * @return  {void}
   */
  static enqueueNewGame = () => {
    setTimeout(() => {
        Dice.hasStartedYet = true;
      }, Dice.queueTime * 1000
    );
  }

  /**
   * Resets the points/contributors and enqueues a new game
   *
   * @return  {void}
   */
  static restartGame = () => {
    Dice.points = 0;
    Dice.gameFinished = false;
    Dice.hasStartedYet = false;
    Dice.contributors = {};

    // Enqueue a new game
    Dice.enqueueNewGame();
  }

  /**
   * Updates the contributors object by increasing their current points / adds
   * a new contributor if it's his first roll in this round.
   *
   * @param   {string}    contributor  Message owner (nickname)
   * @param   {integer}   points       Amount of points of the current roll
   *
   * @return  {void}
   */
  static addContribution = (contributor, points) => {
    if (typeof Dice.contributors[contributor] === "undefined") {
      Dice.contributors[contributor] = points;
    } else {
      Dice.contributors[contributor] += points;
    }
  }

  /**
   * Constructs an Embed Message Header, printing the game contributors
   *
   * @return  {string}  Winners string message
   */
  static getContributors = () => {
    let contributors = "";

    // Sort the game contributors by points, descending
    const playersSorted = new Map(
      Object.entries(Dice.contributors)
        .sort(
          (a, b) => {
            return b[1] - a[1];
          }
        )
    );

    // Create the leaderboard string
    let placing = 1;
    for (const [player, points] of playersSorted) {
      let medal = Dice.medals[placing];
      
      // A medal will be prepended only for the first three places
      contributors += 
        (
          (typeof medal !== "undefined")
            ? medal
            : `${placing}.`
        ) + ` ${player}: ${points}\n`;
      placing++;
    }

    // Print the player with the most points
    let header = `Game over! Next round will be started in ${Dice.queueTime} seconds.\n\n`;
    let message = `Leaderboard:\n\n`

    return header + message + contributors+`\n`;
  }

  /**
   * @param   {object}  constants  Dice Constants (options.constants.dice)
   */
  constructor(constants, msg) {
    /**
     * Contains points rewarded for certain rolls
     *
     * @var {Object}
     */
    this.pointsTable = constants.points;

    /**
     * Messages partials for __special__ rolls
     *
     * @var {object}
     */
    this.messages = constants.messages;

    /**
     * Colors constants for message Embed accent
     *
     * @var {object}
     */
    this.colors = constants.colors;

    /**
     * Total amount of required points to finish the game
     *
     * @var {integer}
     */
    this.pointsRequired = constants.pointsRequired;

    /**
     * Defines the time before the next round can be started
     * Once the game is finished, players have to wait before the next round.
     *
     * @var {integer}
     */
    this.gameQueueTime = this.setQueueTime(constants.timeBeforeNextRound);

    /**
     * Stores the result of a dice roll
     * 
     * @var {array}
     */
    this.diceRolls = [,,,,,];
  
    /**
     * Amount of points in the current roll executed by the player.
     * Adds to the total, used in the Embed
     * 
     * @var {integer}
     */
    this.amountOfPointsThisRound = 0;

    /**
     * A partial appended to the final message when user rolls a special (something other
     * than just Ones/Fives/Nothing)
     *
     * @var {string}
     */
    this.rollMessage = "";

    /**
     * Defines the Embed color for the player's roll outcome.
     * The Embed message will have a White accent by default, 
     * changin each time the player rolls a special combination - more than just Ones of Fives
     *
     * @var {integer}
     */
    this.rollColor = constants.colors.nothing;

    /**
     * Currently processed Discord message
     *
     * @var {object}
     */
    this.msg = msg;
  }

  setQueueTime = (time) => {
    Dice.queueTime = time;
  }

  /**
   * Rolls the dice five times and stores the roll values
   *
   * @return  {object}
   */
  roll = () => {
    // __We only need the index number__
    for (const [index] of this.diceRolls.entries()) {
      // "Roll" the dice
      let number = rngService.getRandomInt(1, 6);
      this.diceRolls[index] = number;
    }

    // Sort the outcomes, ascending
    this.diceRolls.sort();

    // We have to walk through the rules from the most to least rewarding
    // and the first applied rule has to break further checks
    this.detectAppliedRule();

    /**
     * To avoid modifying the output, we will work on cached variable,
     * otherwise the Embedded message will show incorrect points reward for the roll
     */
    let currentRollPoints = this.amountOfPointsThisRound;

    // Increase the global points
    Dice.points += currentRollPoints;

    // Flag the game as Finished if we have hit the total amount of points required
    if (Dice.points >= this.pointsRequired) {
      Dice.gameFinished = true;

      // In case the points overflow after the game is finished, add only the missing amount of points
      // to prevent the user contributing the full amount if for example 10 points were missing
      let pointsDifference = Dice.points - this.pointsRequired;
      if (pointsDifference > 0) {
        currentRollPoints -= pointsDifference;
      }
    }

    // Add the current user to the contributions table, but don't add the full amount
    // Reduced by the points difference if the game has ended
    Dice.addContribution(this.msg.author.username, currentRollPoints);

    return {
      message: `${this.rollMessage}`,
      points : this.amountOfPointsThisRound,
      color  : this.rollColor,
    }
  }

  /**
   * Finds what type of combination exists in the current dice rolls
   *
   * @return  {void}
   */
  detectAppliedRule = () => {
    for (const rule in this.rules) {
      // We have to ignore the extracted methods as they are not used in the game rules validation
      if (rule === "isStraight" || rule === "countOccurrences") {
        continue;
      }

      // If this current rule has met its condition, we have to abort the
      // further execution and return the embed message
      let ruleApplied = this.rules[rule]();

      if (ruleApplied === true) {
        break;
      }
    }
  }

  /**
   * Basic rules excluding detailed conditions (555 pts, tank, etc)
   * 
   * @var {object}
   */
  rules = {
    /**
     * Checks if the dice rolls form a Straight
     * This rule applies to both Low and High Straights
     * 
     * @param   {string}    message   Message of the special roll (Low Straight / High Straight)
     * @param   {integer}   points    Amount of points awarded for this special roll
     * @param   {integer}   color     Color value for the special roll (Embed message accent)
     * 
     * @return  {bool}
     */
    isStraight: (message, points, color) => {
      for (const [index, number] of this.diceRolls.entries()) {
        let nextNumber = this.diceRolls[index + 1];
        
        /**
         * If we reach the point where we fall out of bounds, it means we have
         * met the conditions of this rule, because the difference between the
         * last and (last - 1) element was 1, which resulted in consecutive 
         * +1 sequence of the rolled numbers
         */
        if (isNaN(nextNumber) === true) {
          break;
        }

        // Break and abort if the next number is not greater than 1
        // This means the same number or greater than 2 will not form a Straight sequence
        if ((nextNumber - number) !== 1 ) {
          return false;
        }
      }

      this.rollMessage             = message;
      this.rollColor               = color;
      this.amountOfPointsThisRound = points;

      // If all rolls formed a High Straight, inform that we have met
      // the conditions for this rule, therefore aborting further rule checks
      return true;
    },

    /**
     * Checks if there is a required amount of occurrences of at least one element
     * of the given array of elements
     *
     * @param   {integer}   occurrencesRequired   Required amount of occurrences of at least one element
     * @param   {string}    message               Message of the special roll (Low Straight / High Straight)
     * @param   {integer}   points                Amount of points awarded for this special roll
     * @param   {integer}   color                 Color value for the special roll (Embed message accent)
     *
     * @return  {bool}
     */
    countOccurrences: (occurrencesRequired, message, points, color) => {
      // There can only be one `Three of a Kind` / `Four` or a Flush, so we can break after the first occurrence
      let numberCounts = _.countBy(this.diceRolls);

      for (const count in numberCounts) {
        if (numberCounts[count] === occurrencesRequired) {
          this.rollMessage = message;
          this.rollColor = color
          this.amountOfPointsThisRound = points;

          return true;
        }
      }

      return false;
    },

    /**
     * Checks if there is a combination of 5 same numbers in the rolls
     *
     * @return  {bool}
     */
    isFlush: () => {
      return this.rules.countOccurrences(
        5,
        this.messages.flush,
        this.pointsTable.flush,
        this.colors.flush
      );
    },

    /**
     * High Straight starts from 2. If the first roll is a different number,
     * abort and go to the next rule
     *
     * @return  {bool}
     */
    isStraightHigh: () => {
      // Continue only if the first roll is 2
      if (this.diceRolls[0] !== 2) {
        return false;
      }

      return this.rules.isStraight(
        this.messages.straight_high,
        this.pointsTable.straight_high,
        this.colors.straight_high
      );
    },

    /**
     * Low Straight starts from 1. If the first roll is a different number,
     * abort and go to the next rule
     *
     * @return  {bool}
     */
    isStraightLow: () => {
      // Continue only if the first roll is 1
      if (this.diceRolls[0] !== 1) {
        return false;
      }

      return this.rules.isStraight(
        this.messages.straight_low,
        this.pointsTable.straight_low,
        this.colors.straight_low
      );
    },

    /**
     * Checks if the rolls contain Full House - a combination of 3 + 2 of the same rolls
     *
     * @return  {bool}
     */
    isFullHouse: () => {
      let numberCounts = _.countBy(this.diceRolls);

      // Build an array of sorted object properties values
      // We have to sort the repetitions descending to perform the simplest check for this rule:
      //  - First element: 3 repetitions, / Second element: 2 repetitions
      let repetitions = Object.values(numberCounts).sort(
        (a, b) => {
          return b-a;
        }
      );
      
      // Once we get the sorted elements, we only have to check if
      // the first and second element has repetitions of 3 and 2.
      if (repetitions[0] == 3 && repetitions[1] == 2) {
        this.rollMessage = this.messages.full_house;
        this.rollColor = this.colors.full_house;
        this.amountOfPointsThisRound = this.pointsTable.full_house;

        return true;
      }

      return false;
    },

    /**
     * Checks if there was a quadruple repeat of one roll
     *
     * @return  {bool}
     */
    isFourOfAKind: () => {
      return this.rules.countOccurrences(
        4,
        this.messages.four_of_a_kind,
        this.pointsTable.four_of_a_kind,
        this.colors.four_of_a_kind
      );
    },

    /**
     * Checks if there was a triple repeat of one roll.
     * This has to be checked after Full House, because it also contains
     * Three of a Kind with an addition of a pair, so we could lose points
     * if we checked this rule as first.
     *
     * @return  {bool}
     */
    isThreeOfAKind: () => {
      return this.rules.countOccurrences(
        3,
        this.messages.three_of_a_kind,
        this.pointsTable.three_of_a_kind,
        this.colors.three_of_a_kind
      );
    },

    /**
     * The msot basic rule, checks if the rolls have 1 or 5.
     * Each '1' is worth 10 points, a '5' is worth 5 points
     * 
     * There will be no return value, because we are not displaying a
     * special message for higher combinations
     * 
     * @return  {bool}
     */
    hasOneOrFive: () => {
      let foundNumbers = false;

      for (const number of this.diceRolls) {
        if (number === 1) {
          this.amountOfPointsThisRound += this.pointsTable.one;
          foundNumbers = true;
        } else if ( number === 5) {
          this.amountOfPointsThisRound += this.pointsTable.five;
          foundNumbers = true;
        }
      }

      // If we ever get to this point, we have to display a generic roll message
      this.rollMessage = this.messages.nothing;
      this.rollColor = this.colors.nothing;

      return foundNumbers;
    }
  }
}

module.exports = {
  Dice,
}
