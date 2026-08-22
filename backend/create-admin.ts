import sequelize from './src/config/database';
import './src/models'; // This ensures all models are loaded
import User from './src/models/User';

async function run() {
  await sequelize.authenticate();
  await sequelize.sync();
  
  const existing = await User.findOne({ where: { role: 'admin' } });
  if (!existing) {
    const admin = await User.create({
      username: 'admin',
      password_hash: '',
      role: 'admin',
      email: 'admin@hazukipos.com',
      name: 'Administrador'
    });
    await admin.setPassword('admin123');
    await admin.save();
    console.log("Admin created: username=admin, password=admin123");
  } else {
    console.log("Admin already exists: ", existing.username);
  }
}
run();
