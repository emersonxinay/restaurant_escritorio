import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TableAttributes {
  id: number;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'cleaning' | 'reserved';
  created_at?: Date;
  updated_at?: Date;
}

interface TableCreationAttributes extends Optional<TableAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Table extends Model<TableAttributes, TableCreationAttributes> implements TableAttributes {
  public id!: number;
  public number!: number;
  public capacity!: number;
  public status!: 'available' | 'occupied' | 'cleaning' | 'reserved';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Table.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    number: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    capacity: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('available', 'occupied', 'cleaning', 'reserved'), allowNull: false, defaultValue: 'available' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'tables', timestamps: false, underscored: true }
);

export default Table;
