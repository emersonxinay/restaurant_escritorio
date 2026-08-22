const { Sequelize } = require('sequelize');
const fs = require('fs');

async function restore() {
  const sq = new Sequelize({
    dialect: 'sqlite',
    storage: './database.sqlite',
    logging: false,
  });

  try {
    await sq.authenticate();
    console.log("Connected to sqlite");
    
    // We can't easily insert without the models, 
    // it's easier to use the TypeScript models!
  } catch (err) {
    console.error(err);
  }
}
restore();
