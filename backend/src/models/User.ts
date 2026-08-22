import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcryptjs from 'bcryptjs';

interface UserAttributes {
  id: number;
  username: string;
  password_hash: string;
  email: string;
  name: string;
  role: 'admin' | 'waiter' | 'cashier' | 'kitchen' | 'bar' | 'customer';
  station_id?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password_hash!: string;
  public email!: string;
  public name!: string;
  public role!: 'admin' | 'waiter' | 'cashier' | 'kitchen' | 'bar' | 'customer';
  public station_id?: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  async setPassword(password: string): Promise<void> {
    const salt = await bcryptjs.genSalt(10);
    this.password_hash = await bcryptjs.hash(password, salt);
  }

  async checkPassword(password: string): Promise<boolean> {
    return bcryptjs.compare(password, this.password_hash);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'waiter', 'cashier', 'kitchen', 'bar', 'customer'),
      allowNull: false,
      defaultValue: 'customer'
    },
    station_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
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
    tableName: 'users',
    timestamps: false,
    underscored: true
  }
);

export default User;
