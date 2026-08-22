import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Generar JWT
const generateToken = (user: any) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      station_id: user.station_id
    },
    (process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_me_in_production') as string,
    { expiresIn: process.env.JWT_EXPIRY || '7d' } as jwt.SignOptions
  );
};

// POST /api/auth/register
router.post('/register', async (req: any, res: Response) => {
  try {
    const { username, password, email, name } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      res.status(409).json({ message: 'Username already taken' });
      return;
    }

    // Crear nuevo usuario
    const user = await User.create({
      username,
      password_hash: '',
      email: email || null,
      name: name || null,
      role: 'customer'
    });
    await user.setPassword(password);
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, station_id: user.station_id }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: any, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Buscar usuario por username o email
    const user = await User.findOne({ 
      where: { 
        [Op.or]: [
          { username: username },
          { email: username }
        ]
      } 
    });
    if (!user) {
      res.status(401).json({ message: 'Invalid username/email or password' });
      return;
    }

    // Verificar si el usuario está activo
    if (!user.is_active) {
      res.status(403).json({ message: 'Account has been deactivated. Please contact an administrator.' });
      return;
    }

    // Verificar contraseña
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid username/email or password' });
      return;
    }

    // Generar token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, station_id: user.station_id }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/create-admin (solo si no existe admin)
router.post('/create-admin', async (req: any, res: Response) => {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      res.status(409).json({ message: 'An admin already exists' });
      return;
    }

    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: 'Username and password are required' });
      return;
    }

    // Crear admin
    const admin = await User.create({ username, password_hash: '', role: 'admin' });
    await admin.setPassword(password);
    await admin.save();

    const token = generateToken(admin);

    res.status(201).json({
      message: 'Admin created successfully',
      token,
      user: { id: admin.id, username: admin.username, role: admin.role, station_id: admin.station_id }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, station_id: user.station_id } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logout successful' });
});

export default router;
