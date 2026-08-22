import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export interface CashMovementAttributes {
  id: number;
  date: Date; // The date string YYYY-MM-DD to link with DailyClose
  type: 'expense' | 'income';
  amount: number;
  observation: string;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface CashMovementCreationAttributes extends Optional<CashMovementAttributes, 'id'> {}

class CashMovement extends Model<CashMovementAttributes, CashMovementCreationAttributes> implements CashMovementAttributes {
  public id!: number;
  public date!: Date;
  public type!: 'expense' | 'income';
  public amount!: number;
  public observation!: string;
  public created_by!: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public user?: User;
}

CashMovement.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('expense', 'income'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    observation: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'cash_movements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default CashMovement;
