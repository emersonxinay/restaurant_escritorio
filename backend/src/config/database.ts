import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const defaultDbPath = path.join(__dirname, '../../database.sqlite');
const userDbPath = process.env.DB_STORAGE;

if (userDbPath) {
  let shouldCopy = false;
  if (!fs.existsSync(userDbPath)) {
    shouldCopy = true;
  } else {
    const stats = fs.statSync(userDbPath);
    if (stats.size < 20480) { // Less than 20KB means it's an empty database from a failed run
      shouldCopy = true;
    }
  }

  if (shouldCopy && fs.existsSync(defaultDbPath)) {
    fs.copyFileSync(defaultDbPath, userDbPath);
    console.log(`Copied initial database from ${defaultDbPath} to ${userDbPath}`);
  }
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: userDbPath || defaultDbPath,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

export default sequelize;
