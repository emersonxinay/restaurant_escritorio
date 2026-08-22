import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface OrderAttributes {
  id: number;
  order_number: string;
  user_id?: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  delivery_type: 'pickup' | 'delivery' | 'dine_in' | 'to_go';
  delivery_address?: string;
  delivery_references?: string;
  delivery_lat?: number;
  delivery_lng?: number;
  delivery_street_number?: string;
  delivery_property_type?: 'house' | 'apartment';
  delivery_apartment_number?: string;
  delivery_fee: number;
  subtotal: number;
  discount_amount: number;
  tip_amount: number;
  total: number;
  items: Array<{ product_id: number; product_name: string; price: number; quantity: number }>;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
  table_id?: number;
  waiter_id?: number;
  cashier_id?: number;
  payment_status: 'pending' | 'partial' | 'paid';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: number;
  public order_number!: string;
  public user_id?: number;
  public customer_name!: string;
  public customer_phone!: string;
  public customer_email?: string;
  public delivery_type!: 'pickup' | 'delivery' | 'dine_in' | 'to_go';
  public delivery_address?: string;
  public delivery_references?: string;
  public delivery_lat?: number;
  public delivery_lng?: number;
  public delivery_street_number?: string;
  public delivery_property_type?: 'house' | 'apartment';
  public delivery_apartment_number?: string;
  public delivery_fee!: number;
  public subtotal!: number;
  public discount_amount!: number;
  public tip_amount!: number;
  public total!: number;
  public items!: Array<{ product_id: number; product_name: string; price: number; quantity: number }>;
  public status!: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
  public table_id?: number;
  public waiter_id?: number;
  public cashier_id?: number;
  public payment_status!: 'pending' | 'partial' | 'paid';
  public notes?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Associations
  public waiter?: User;

  generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    customer_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    customer_phone: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    customer_email: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    delivery_type: {
      type: DataTypes.ENUM('pickup', 'delivery', 'dine_in', 'to_go'),
      allowNull: false,
      defaultValue: 'pickup'
    },
    delivery_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    delivery_references: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    delivery_lat: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    delivery_lng: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    delivery_street_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    delivery_property_type: {
      type: DataTypes.ENUM('house', 'apartment'),
      allowNull: true
    },
    delivery_apartment_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    delivery_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    tip_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    items: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending'
    },
    table_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    waiter_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cashier_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    payment_status: {
      type: DataTypes.ENUM('pending', 'partial', 'paid'),
      allowNull: false,
      defaultValue: 'pending'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: false,
    underscored: true
  }
);

export default Order;
