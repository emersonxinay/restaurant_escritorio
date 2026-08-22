import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OrderItemAttributes {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  status: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'served' | 'delivered';
  rejected_reason?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface OrderItemCreationAttributes extends Optional<OrderItemAttributes, 'id' | 'created_at' | 'updated_at'> {}

class OrderItem extends Model<OrderItemAttributes, OrderItemCreationAttributes> implements OrderItemAttributes {
  public id!: number;
  public order_id!: number;
  public product_id!: number;
  public quantity!: number;
  public status!: 'pending' | 'accepted' | 'rejected' | 'preparing' | 'ready' | 'served' | 'delivered';
  public rejected_reason?: string;
  public notes?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

OrderItem.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    status: { type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'preparing', 'ready', 'served', 'delivered'), allowNull: false, defaultValue: 'pending' },
    rejected_reason: { type: DataTypes.TEXT, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'order_items', timestamps: false, underscored: true }
);

export default OrderItem;
