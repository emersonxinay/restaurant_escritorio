import User from './User';
import Category from './Category';
import Product from './Product';
import Discount from './Discount';
import Reservation from './Reservation';
import Order from './Order';
import Station from './Station';
import Table from './Table';
import OrderItem from './OrderItem';
import Payment from './Payment';
import AuditLog from './AuditLog';
import DailyClose from './DailyClose';
import CashMovement from './CashMovement';

// Setup associations - Define once and only once
export const setupAssociations = () => {
  // Product - Category
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
  Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });

  // Product - Station
  Product.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
  Station.hasMany(Product, { foreignKey: 'station_id', as: 'products' });

  // User - Station (Cooks/Bartenders belong to a station)
  User.belongsTo(Station, { foreignKey: 'station_id', as: 'station' });
  Station.hasMany(User, { foreignKey: 'station_id', as: 'users' });

  // Discount - User
  Discount.belongsTo(User, { foreignKey: 'created_by_admin_id', as: 'created_by' });
  User.hasMany(Discount, { foreignKey: 'created_by_admin_id', as: 'created_discounts' });

  // Order - User (Customer)
  Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });

  // Order - Table
  Order.belongsTo(Table, { foreignKey: 'table_id', as: 'table' });
  Table.hasMany(Order, { foreignKey: 'table_id', as: 'orders' });

  // Order - Waiter
  Order.belongsTo(User, { foreignKey: 'waiter_id', as: 'waiter' });
  // Order - Cashier
  Order.belongsTo(User, { foreignKey: 'cashier_id', as: 'cashier' });

  // Order - OrderItem
  Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'order_items' });
  OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

  // OrderItem - Product
  OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
  Product.hasMany(OrderItem, { foreignKey: 'product_id', as: 'order_items' });

  // Order - Payment
  Order.hasMany(Payment, { foreignKey: 'order_id', as: 'payments' });
  Payment.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

  // AuditLog - User
  AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });



  DailyClose.belongsTo(User, { as: 'cashier', foreignKey: 'closed_by' });
  CashMovement.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
};

export { User, Category, Product, Discount, Reservation, Order, Station, Table, OrderItem, Payment, AuditLog, DailyClose, CashMovement };
