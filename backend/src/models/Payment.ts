import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface PaymentAttributes {
  id: number;
  order_id: number;
  amount: number;
  method: 'cash' | 'card_transbank' | 'transfer' | 'mixed';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at?: Date;
  updated_at?: Date;
}

interface PaymentCreationAttributes extends Optional<PaymentAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  public id!: number;
  public order_id!: number;
  public amount!: number;
  public method!: 'cash' | 'card_transbank' | 'transfer' | 'mixed';
  public status!: 'pending' | 'completed' | 'failed' | 'refunded';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Payment.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    method: { type: DataTypes.ENUM('cash', 'card_transbank', 'transfer', 'mixed'), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'), allowNull: false, defaultValue: 'completed' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'payments', timestamps: false, underscored: true }
);

export default Payment;
