import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

type DiscountStatus = 'programmed' | 'active' | 'expired' | 'cancelled';

interface DiscountAttributes {
  id: number;
  title: string;
  percentage: number;
  start_date: Date;
  end_date: Date;
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  auto_apply: boolean;
  status: DiscountStatus;
  created_by_admin_id?: number;
  created_at: Date;
  updated_at: Date;
}

interface DiscountCreationAttributes extends Optional<DiscountAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Discount extends Model<DiscountAttributes, DiscountCreationAttributes> implements DiscountAttributes {
  public id!: number;
  public title!: string;
  public percentage!: number;
  public start_date!: Date;
  public end_date!: Date;
  public start_time?: string;
  public end_time?: string;
  public is_active!: boolean;
  public auto_apply!: boolean;
  public status!: DiscountStatus;
  public created_by_admin_id?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // Association
  public created_by?: User;

  isCurrentlyActive(): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentTime = now.toTimeString().slice(0, 5);

    // Verificar si está en el rango de fechas
    const startDate = new Date(this.start_date);
    const endDate = new Date(this.end_date);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (!this.is_active || today < startDate || today > endDate) {
      return false;
    }

    // Si no hay restricciones de hora, está activo todo el día
    if (!this.start_time || !this.end_time) {
      return true;
    }

    // Verificar si está en el rango de horas
    if (currentTime >= this.start_time && currentTime <= this.end_time) {
      return true;
    }

    return false;
  }

  applyToPrice(originalPrice: number): number {
    if (!this.auto_apply || !this.isCurrentlyActive()) {
      return originalPrice;
    }

    const discountAmount = originalPrice * (this.percentage / 100);
    return parseFloat((originalPrice - discountAmount).toFixed(2));
  }

  updateStatus(): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(this.start_date);
    const endDate = new Date(this.end_date);

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    if (today < startDate) {
      this.status = 'programmed';
    } else if (today > endDate) {
      this.status = 'expired';
    } else if (this.isCurrentlyActive()) {
      this.status = 'active';
    } else {
      this.status = 'programmed';
    }
  }

  getTimeRemaining(): string | null {
    if (!this.isCurrentlyActive()) {
      return null;
    }

    const now = new Date();
    const endDateTime = new Date(this.end_date);
    const [hours, minutes] = (this.end_time || '23:59').split(':');
    endDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

    if (now < endDateTime) {
      const remaining = endDateTime.getTime() - now.getTime();
      const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      return `${days}d ${hrs}h ${mins}m`;
    }
    return null;
  }

  canBeEdited(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(this.start_date);
    startDate.setHours(0, 0, 0, 0);

    return this.status === 'programmed' && today < startDate;
  }

  canBeReactivated(): boolean {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentTime = now.toTimeString().slice(0, 5);

    if (!this.is_active) {
      const startDate = new Date(this.start_date);
      const endDate = new Date(this.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      if (today >= startDate && today <= endDate) {
        if (this.start_time && this.end_time) {
          if (today.getTime() === startDate.getTime() && currentTime < this.start_time) {
            return false;
          }
          if (today.getTime() === endDate.getTime() && currentTime > this.end_time) {
            return false;
          }
        }
        return true;
      }
    }
    return false;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      percentage: this.percentage,
      start_date: this.start_date.toISOString().split('T')[0],
      end_date: this.end_date.toISOString().split('T')[0],
      start_time: this.start_time || null,
      end_time: this.end_time || null,
      is_active: this.is_active,
      auto_apply: this.auto_apply,
      status: this.status,
      is_currently_active: this.isCurrentlyActive(),
      time_remaining: this.getTimeRemaining(),
      can_be_edited: this.canBeEdited(),
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString()
    };
  }

  static getCurrentActive(): Discount | null {
    // This will be implemented as a static method that queries the database
    return null;
  }

  static getHistory(days: number = 30): Discount[] {
    // This will be implemented as a static method that queries the database
    return [];
  }

  static getUpcoming(days: number = 30): Discount[] {
    // This will be implemented as a static method that queries the database
    return [];
  }
}

Discount.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    percentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 5,
        max: 50
      }
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    auto_apply: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'programmed'
    },
    created_by_admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id'
      }
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
    tableName: 'discounts',
    timestamps: false,
    underscored: true
  }
);

export default Discount;
