import { DailyClose } from './src/models';
import sequelize from './src/config/database';

async function syncDB() {
  await DailyClose.sync({ alter: true });
  console.log("DailyClose synced successfully");
}

syncDB().catch(console.error).finally(() => process.exit(0));
