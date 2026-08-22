import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import QRCode from 'qrcode';

interface ReservationAttributes {
  id: number;
  name: string;
  email: string;
  phone: string;
  date: Date;
  time: string;
  people: number;
  details?: string;
  qr_code?: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'no_show';
  created_at: Date;
  updated_at: Date;
}

interface ReservationCreationAttributes extends Optional<ReservationAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Reservation extends Model<ReservationAttributes, ReservationCreationAttributes> implements ReservationAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public phone!: string;
  public date!: Date;
  public time!: string;
  public people!: number;
  public details?: string;
  public qr_code?: string;
  public status!: 'pending' | 'confirmed' | 'rejected' | 'no_show';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  isValidDate(): boolean {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const reservationDate = new Date(this.date);
    reservationDate.setHours(0, 0, 0, 0);

    const maxDate = new Date(currentDate);
    maxDate.setDate(maxDate.getDate() + 60); // 2 meses

    return reservationDate >= currentDate && reservationDate <= maxDate;
  }

  isValidTime(): boolean {
    const [hours, minutes] = this.time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;

    // 1:30 PM to 9:45 PM
    const startTime = 13 * 60 + 30; // 1:30 PM (810 minutes)
    const endTime = 21 * 60 + 45;   // 9:45 PM (1305 minutes)

    // Check if time is within the valid window
    if (timeInMinutes < startTime || timeInMinutes > endTime) {
      return false;
    }

    // Check if time is in 15-minute intervals from 1:30 PM
    // Valid times: 1:30, 1:45, 2:00, 2:15, ..., 9:30, 9:45
    const minutesFromStart = timeInMinutes - startTime;
    return minutesFromStart % 15 === 0;
  }

  async generateQRCode(): Promise<void> {
    const data = `Reservación para ${this.name} en ${this.date.toISOString().split('T')[0]} a las ${this.time}`;
    this.qr_code = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'L',
      type: 'image/png',
      width: 300
    });
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      phone: this.phone,
      date: this.date.toISOString().split('T')[0],
      time: this.time,
      people: this.people,
      details: this.details,
      qr_code: this.qr_code,
      status: this.status,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString()
    };
  }
}

Reservation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    people: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    details: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'rejected', 'no_show'),
      defaultValue: 'pending',
      allowNull: false
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
    tableName: 'reservations',
    timestamps: false,
    underscored: true
  }
);

export default Reservation;
