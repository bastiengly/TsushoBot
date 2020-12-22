"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert("Media", [
      {
        mediaContent: "https://test.com/",
        requestedByUserId: "1234567890",
        commandName: "alk",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete("Media", null, {});
  },
};
