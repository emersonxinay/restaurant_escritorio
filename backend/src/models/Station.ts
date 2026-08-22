import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface StationAttributes {
  id: number;
  name: string;
  description?: string;
  printer_ip?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface StationCreationAttributes extends Optional<StationAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Station extends Model<StationAttributes, StationCreationAttributes> implements StationAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public printer_ip?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Station.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(50), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    printer_ip: { type: DataTypes.STRING(50), allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'stations', timestamps: false, underscored: true }
);

export default Station;
