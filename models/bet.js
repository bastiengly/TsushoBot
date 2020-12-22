"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Bet extends Model {
    static associate(models) {
      Bet.belongsTo(models.User);
    }
  }

  Bet.init(
    {
      userId: {
        allowNull: false,
        type: DataTypes.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
      },
      outcome: {
        defaultValue: 0,
        type: DataTypes.INTEGER,
      },
      amount: {
        defaultValue: 0,
        type: DataTypes.INTEGER,
      },
    },
    {
      sequelize,
      modelName: "Bet",
      tableName: "Bets",
    }
  );

  return Bet;
};
