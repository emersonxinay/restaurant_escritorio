const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
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

async function resetPasswords() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash('123456', salt);
    await sequelize.query('UPDATE users SET password_hash = :hash', {
      replacements: { hash }
    });
    console.log('Todas las contraseñas fueron restablecidas a "123456"');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
resetPasswords();
