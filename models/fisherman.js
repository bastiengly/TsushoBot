"use strict";
const { Model } = require("sequelize");
const fishService = require("../services/fishService");
module.exports = (sequelize, DataTypes) => {
  class Fisherman extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    getValueOfInv() {
      let value = fishService.getValueOfInv(this);
      let bonus = value > 1000 ? 1.2 : 1;
      return value * bonus;
    }

    sellInventory() {
      let temp = this.getValueOfInv();
      console.log(this.User.balance);
      this.User.balance += temp;
      this.removeAllFish();
      this.User.save();
      return temp;
    }

    removeAllFish() {
      this.fish = 0;
      this.motorized_wheelchair = 0;
      this.manual_wheelchair = 0;
      this.heart = 0;
      this.blowfish = 0;
      this.tropical_fish = 0;
      this.boot = 0;
      this.wrench = 0;
    }

    addItem(id) {
      let item1 = new fishService.Item(id);
      if (eval("this." + item1.userp)) return false;
      if (this.User.balance >= item1.price) {
        eval("this." + item1.userp + "=true");
        this.User.balance -= item1.price;
        this.User.save();
        return true;
      }
    }

    static associate(models) {
      Fisherman.belongsTo(models.User);

      Fisherman.findOrCreateByDiscordId = async (id) => {
        const [user] = await models.User.findOrCreate({
          where: {
            discordId: id,
          },
        }).catch((err) => {
          console.error(err);
        });
        const [fisherman] = await Fisherman.findOrCreate({
          where: { userId: user.id },
          include: [{ model: models.User }],
        }).catch((err) => {
          console.error(err);
        });
        return fisherman;
      };
    }
  }

  Fisherman.init(
    {
      userId: {
        allowNull: false,
        unique: true,
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
      },
      fish: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      motorized_wheelchair: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      manual_wheelchair: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      heart: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      blowfish: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      tropical_fish: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      boot: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      wrench: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      line: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      bait: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      boat: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      sequelize,
      modelName: "Fisherman",
      tableName: "Fishermen",
    }
  );

  return Fisherman;
};
