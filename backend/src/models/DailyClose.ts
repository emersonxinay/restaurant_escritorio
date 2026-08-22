import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export interface DailyCloseAttributes {
  id: number;
  date: Date; // The date this close represents
  opening_balance: number;
  total_sales: number;
  total_card: number;
  total_other: number;
  withdrawals: number;
  extra_incomes: number;
  expected_cash?: number;
  counted_cash?: number;
  difference?: number;
  amount_to_deposit?: number;
  status: 'open' | 'closed';
  closed_by?: number;
  details: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface DailyCloseCreationAttributes extends Optional<DailyCloseAttributes, 'id'> {}

class DailyClose extends Model<DailyCloseAttributes, DailyCloseCreationAttributes> implements DailyCloseAttributes {
  public id!: number;
  public date!: Date;
  public opening_balance!: number;
  public total_sales!: number;
  public total_card!: number;
  public total_other!: number;
  public withdrawals!: number;
  public extra_incomes!: number;
  public expected_cash?: number;
  public counted_cash?: number;
  public difference?: number;
  public amount_to_deposit?: number;
  public status!: 'open' | 'closed';
  public closed_by?: number;
  public details!: any;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public cashier?: User;
}

DailyClose.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      unique: true // Usually one close per day
    },
    opening_balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_sales: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_card: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    total_other: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    withdrawals: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    extra_incomes: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    expected_cash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    counted_cash: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    difference: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    amount_to_deposit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('open', 'closed'),
      allowNull: false,
      defaultValue: 'open'
    },
    closed_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    details: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'daily_closes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default DailyClose;
