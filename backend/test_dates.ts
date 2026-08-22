import { Op } from 'sequelize';
import sequelize from './src/config/database';
import { Order } from './src/models';

async function test() {
  const startDate = "2026-08-17";
  const endDate = "2026-08-17";
  
  // Method 1
  const m1_start = new Date(startDate);
  const m1_end = new Date(endDate);
  m1_end.setHours(23, 59, 59, 999);
  
  const m1 = await Order.count({
    where: { created_at: { [Op.between]: [m1_start, m1_end] } }
  });

  // Method 2 (cashier.ts)
  const d = new Date(startDate);
  const m2_start = new Date(d); m2_start.setHours(0,0,0,0);
  const m2_end = new Date(d); m2_end.setHours(23,59,59,999);
  const m2 = await Order.count({
    where: { created_at: { [Op.between]: [m2_start, m2_end] } }
  });

  // Method 3 (string concat)
  const m3 = await Order.count({
    where: { created_at: { [Op.between]: [`${startDate} 00:00:00`, `${endDate} 23:59:59.999`] } }
  });

  console.log({ m1, m2, m3 });
}

test().catch(console.error).finally(() => process.exit(0));
