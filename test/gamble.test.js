const chai = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const sandbox = sinon.createSandbox();
const gamble = require("../commands/gamble");
const constants = require("../config/constants").constants;
const embedService = require("../services/embedService");
const rngService = require("../services/rngService");
const userModel = require("../models").sequelize.models.User;
const betModel = require("../models").sequelize.models.Bet;
chai.use(sinonChai);
const expect = chai.expect;

describe("!gamble", () => {
  afterEach("restore sandbox", () => {
    if (sandbox) sandbox.restore();
  });

  describe("constants", () => {
    const gambleOutcomes = constants.gambleOutcomes;
    describe("constants presence", () => {
      it("should have default constants file created", () => {
        expect(gambleOutcomes).to.not.deep.equal("undefined");
      });
    });

    describe("constants integrity", () => {
      it("should contain arrays", () => {
        const requiredKeys = ["win", "loss"];
        const currentKeys = Object.keys(gambleOutcomes);
        const assertion = requiredKeys.every((element) => {
          return currentKeys.includes(element);
        });

        expect(assertion).to.deep.equal(true);
      });
    });
  });

  describe("execute", () => {
    const mockMessage = { author: { username: "test_user", id: 1 } };

    beforeEach("stub sandbox", () => {
      this.mockUser = {
        id: 1,
        balance: 10,
        save: sandbox.stub().resolves(true),
      };
      this.stubEmbedMessage = sandbox.stub(embedService, "embedMessage").returns(true);
      this.stubFindOrCreateByDiscordId = sandbox.stub(userModel, "findOrCreateByDiscordId").returns(this.mockUser);
      this.stubBetCreate = sandbox.stub(betModel, "create").resolves(true);
      this.stubGetRandomInt = sandbox.stub(rngService, "getRandomInt").returns(0);
      this.stubGetRandomArrayIndex = sandbox.stub(rngService, "getRandomArrayIndex").returns("Outcome.");
    });

    const badArgs = ["abc", "$1.99", "o10", ""];
    badArgs.forEach((arg) => {
      it(`should fail with invalid value input: ${arg}`, async () => {
        await gamble.execute(mockMessage, [arg], { constants });
        expect(this.stubEmbedMessage).to.have.been.calledWith(mockMessage, [arg], "You didn't enter a valid amount.");
      });
    });

    it("should fail with value greater than balance", async () => {
      const args = ["15"];
      await gamble.execute(mockMessage, args, { constants });
      expect(this.stubEmbedMessage).to.have.been.calledWith(
        mockMessage,
        args,
        "You can't bet more Tsushobucks than you have."
      );
    });

    const args = ["5", "all"];
    args.forEach((arg, i) => {
      it(`should win and set balance according to value provided: ${arg}`, async () => {
        await gamble.execute(mockMessage, [arg], { constants });

        // This magic Node method forces the test to abide by the above await so the expectations are synchronous.
        setImmediate(() => {
          let profit = 5;
          if (i === 1) profit = 10;
          let endBalance = this.mockUser.balance;
          expect(this.stubGetRandomInt).to.have.been.calledOnce;
          expect(this.stubGetRandomArrayIndex).to.have.been.calledOnce;
          expect(this.stubEmbedMessage).to.have.been.calledWith(
            mockMessage,
            [arg],
            [
              `Outcome. **You won!**`,
              `You earned **${profit}** Tsushobucks.`,
              `Your new balance is **${endBalance}**.`,
            ].join("\n\n")
          );
          expect(this.stubBetCreate).to.have.been.calledWith({
            userId: this.mockUser.id,
            outcome: 0,
            amount: profit,
          });
        });
      });
    });

    it("should lose and set balance according to value provided", async () => {
      const arg = ["5"];
      this.stubGetRandomInt.returns(1);
      await gamble.execute(mockMessage, arg, { constants });
      setImmediate(() => {
        expect(this.stubGetRandomInt).to.have.been.calledOnce;
        expect(this.stubGetRandomArrayIndex).to.have.been.calledOnce;
        expect(this.stubEmbedMessage).to.have.been.calledWith(
          mockMessage,
          arg,
          [`Outcome. **You lost.**`, `You lost **5** Tsushobucks.`, `Your new balance is **5**.`].join("\n\n")
        );
        expect(this.stubBetCreate).to.have.been.calledWith({
          userId: this.mockUser.id,
          outcome: 1,
          amount: 5,
        });
      });
    });
  });

  it("should have the expected name", () => {
    expect(gamble.name).to.deep.equal("!gamble");
  });

  it("should have the expected description", () => {
    expect(gamble.description).to.deep.equal("See if you can win some Tsushobucks quick.");
  });
});
