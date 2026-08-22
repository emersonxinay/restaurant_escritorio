const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'hazuki_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '1234',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function getUsers() {
  try {
    const [results] = await sequelize.query('SELECT id, username, role, name, email FROM users');
    console.log(results);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
getUsers();
