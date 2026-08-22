import { Router, Response } from 'express';
import { Category, Product, Discount, Reservation, User, AuditLog } from '../models';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { getImageUrl } from '../utils/imageProcessor';
import fs from 'fs';
import path from 'path';

const router = Router();

// USERS
// GET /api/admin/users
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json({ users });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/users/:id/role
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.role = role;
    await user.save();

    res.json({ message: 'Role updated successfully', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/users
router.post('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, name, role } = req.body;

    if (!username || !password || !role) {
      res.status(400).json({ message: 'Username, password and role are required' });
      return;
    }

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      res.status(409).json({ message: 'Username already taken' });
      return;
    }

    const user = await User.create({
      username,
      password_hash: '',
      email: email || null,
      name: name || null,
      role: role,
      station_id: req.body.station_id || null,
      is_active: true
    });
    
    await user.setPassword(password);
    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, is_active: user.is_active, station_id: user.station_id }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PATCH /api/admin/users/:id/status
router.patch('/users/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { is_active } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    if (user.id === req.user?.id) {
      res.status(403).json({ message: 'You cannot deactivate yourself' });
      return;
    }

    user.is_active = is_active;
    await user.save();

    res.json({ message: 'User status updated successfully', user: { id: user.id, is_active: user.is_active } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, email, name, role, station_id } = req.body;
    const user = await User.findByPk(req.params.id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if new username is taken
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        res.status(409).json({ message: 'Username already taken' });
        return;
      }
      user.username = username;
    }

    if (password) {
      await user.setPassword(password);
    }
    
    if (email !== undefined) user.email = email || null;
    if (name !== undefined) user.name = name || null;
    if (role) {
      user.role = role;
    }
    if (station_id !== undefined) {
      user.station_id = station_id || null;
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: { id: user.id, username: user.username, email: user.email, name: user.name, role: user.role, is_active: user.is_active, station_id: user.station_id }
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// CATEGORÍAS
// GET /api/admin/categories
router.get('/categories', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await Category.findAll();
    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/categories
router.post('/categories', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, parent_id } = req.body;

    if (!name) {
      res.status(400).json({ message: 'Category name is required' });
      return;
    }

    // If parent_id is provided, validate that parent category exists
    if (parent_id) {
      const parentCategory = await Category.findByPk(parent_id);
      if (!parentCategory) {
        res.status(400).json({ message: 'Parent category not found' });
        return;
      }
    }

    const category = await Category.create({
      name,
      parent_id: parent_id || null
    });
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ message: 'Category already exists' });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

// PUT /api/admin/categories/:id
router.put('/categories/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    category.name = name;
    await category.save();

    res.json({ message: 'Category updated successfully', category });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/categories/:id
router.delete('/categories/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      res.status(404).json({ message: 'Category not found' });
      return;
    }

    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PRODUCTOS
// GET /api/admin/products
router.get('/products', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const products = await Product.findAll({
      include: [{ association: 'category', attributes: ['id', 'name'] }]
    });

    const productsWithImages = products.map(p => ({
      ...p.toJSON(),
      image_url: getImageUrl(p.image_url || 'logofavicon.png')
    }));

    res.json({ products: productsWithImages });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/products
router.post(
  '/products',
  authenticateToken,
  requireAdmin,
  upload.single('image_file'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, price, category_id, station_id, image_url, img_url } = req.body;

      if (!name || !price || !category_id) {
        res.status(400).json({ message: 'Name, price, and category are required' });
        return;
      }

      let finalImageUrl = '';
      if (req.file) {
        finalImageUrl = req.file.filename;
      } else if (image_url && image_url.trim()) {
        finalImageUrl = image_url;
      } else if (img_url && img_url.trim()) {
        finalImageUrl = img_url;
      } else {
        finalImageUrl = 'logofavicon.png';
      }

      const product = await Product.create({
        name,
        description,
        price: parseFloat(price),
        category_id,
        station_id: station_id || null,
        image_url: finalImageUrl
      });

      res.status(201).json({
        message: 'Product created successfully',
        product: {
          ...product.toJSON(),
          image_url: getImageUrl(product.image_url)
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// PUT /api/admin/products/:id
router.put(
  '/products/:id',
  authenticateToken,
  requireAdmin,
  upload.single('image_file'),
  async (req: AuthRequest, res: Response) => {
    try {
      fs.appendFileSync('put_log.txt', JSON.stringify({ body: req.body, headers: req.headers, time: new Date() }) + '\\n');
      console.log('PUT /products/:id - req.body:', req.body);
      const { name, description, price, category_id, station_id, image_url, img_url } = req.body;
      const product = await Product.findByPk(req.params.id);

      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      if (name !== undefined) product.name = name;
      if (description !== undefined) product.description = description;
      if (price !== undefined) product.price = parseFloat(price);
      if (category_id !== undefined) product.category_id = category_id;
      if (station_id !== undefined) {
        product.station_id = station_id || null;
      }

      if (req.file) {
        // File was uploaded
        product.image_url = req.file.filename;
      } else if (image_url && image_url.trim()) {
        // Image URL or filename from form data
        product.image_url = image_url;
      } else if (img_url && img_url.trim()) {
        // Fallback to img_url
        product.image_url = img_url;
      }
      // If no new image provided, keep existing image_url

      await product.save();

      res.json({
        message: 'Product updated successfully',
        product: {
          ...product.toJSON(),
          image_url: getImageUrl(product.image_url)
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
);

// DELETE /api/admin/products/:id
router.delete('/products/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    await product.destroy();
    res.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DESCUENTOS
// GET /api/admin/discounts
router.get('/discounts', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const discounts = await Discount.findAll();
    res.json({ discounts });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/admin/discounts
router.post('/discounts', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, percentage, start_date, end_date, start_time, end_time, is_active, auto_apply } = req.body;

    if (!title || !percentage || !start_date || !end_date) {
      res.status(400).json({ message: 'Title, percentage, start_date, and end_date are required' });
      return;
    }

    const discount = await Discount.create({
      title,
      percentage: parseInt(percentage),
      start_date,
      end_date,
      start_time: start_time || null,
      end_time: end_time || null,
      is_active: is_active || false,
      auto_apply: auto_apply || false
    });

    res.status(201).json({ message: 'Discount created successfully', discount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/discounts/:id
router.put('/discounts/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { title, percentage, start_date, end_date, start_time, end_time, is_active, auto_apply } = req.body;
    const discount = await Discount.findByPk(req.params.id);

    if (!discount) {
      res.status(404).json({ message: 'Discount not found' });
      return;
    }

    discount.title = title;
    discount.percentage = parseInt(percentage);
    discount.start_date = start_date;
    discount.end_date = end_date;
    discount.start_time = start_time || null;
    discount.end_time = end_time || null;
    discount.is_active = is_active;
    discount.auto_apply = auto_apply;

    await discount.save();

    res.json({ message: 'Discount updated successfully', discount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/discounts/:id
router.delete('/discounts/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const discount = await Discount.findByPk(req.params.id);

    if (!discount) {
      res.status(404).json({ message: 'Discount not found' });
      return;
    }

    await discount.destroy();
    res.json({ message: 'Discount deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// IMAGE UPLOAD
// POST /api/admin/products/upload
router.post('/products/upload', authenticateToken, requireAdmin, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    // Store just the filename in the database
    const filename = req.file.filename;

    // Return the processed image URL for frontend display
    const url = getImageUrl(filename);

    res.json({
      message: 'Image uploaded successfully',
      url: url || `/uploads/${filename}`, // Ensure URL is always absolute
      filename // Include filename in case backend needs it
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DASHBOARD
// GET /api/admin/dashboard
router.get('/dashboard', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [categories, products, reservations, users, activeDiscount] = await Promise.all([
      Category.findAll(),
      Product.findAll(),
      Reservation.findAll(),
      User.findAll(),
      Discount.findOne({ where: { is_active: true } })
    ]);

    res.json({
      categories_count: categories.length,
      products_count: products.length,
      reservations_count: reservations.length,
      users_count: users.length,
      active_discount: activeDiscount ? {
        title: activeDiscount.title,
        percentage: activeDiscount.percentage
      } : null
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// IMAGE MANAGEMENT
// GET /api/admin/images - List all uploaded images
router.get('/images', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const uploadsDir = process.env.UPLOAD_DIR || 'uploads';

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      // Return empty list if directory was just created
      res.json({
        images: [],
        total: 0,
        used: 0,
        unused: 0
      });
      return;
    }

    // Read all files in uploads directory
    const files = fs.readdirSync(uploadsDir);

    // Filter only image files and get their info
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = files
      .filter((file: string) => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map((file: string) => {
        const filePath = path.join(uploadsDir, file);
        try {
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            url: getImageUrl(file),
            size: stats.size,
            createdAt: stats.mtime,
            used: false // We'll calculate this from products
          };
        } catch (err) {
          // Skip files that can't be read
          return null;
        }
      })
      .filter((img: any) => img !== null)
      .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());

    // Check which images are being used in products
    const products = await Product.findAll();
    const usedFilenames = new Set(
      products
        .map((p: any) => p.image_url)
        .filter((url: string) => url && !url.startsWith('http') && !url.startsWith('/images'))
    );

    // Mark used images
    images.forEach((img: any) => {
      img.used = usedFilenames.has(img.filename);
    });

    res.json({
      images,
      total: images.length,
      used: images.filter((img: any) => img.used).length,
      unused: images.filter((img: any) => !img.used).length
    });
  } catch (error: any) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/images/:filename - Delete an image
router.delete('/images/:filename', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const filename = req.params.filename;

    // Security: only allow alphanumeric, dash, underscore, dot
    if (!/^[a-zA-Z0-9._\-]+$/.test(filename)) {
      res.status(400).json({ message: 'Invalid filename' });
      return;
    }

    // Check if image is used in any product
    const product = await Product.findOne({
      where: { image_url: filename }
    });

    if (product) {
      res.status(409).json({
        message: `Cannot delete image: used in product "${product.name}"`,
        productId: product.id,
        productName: product.name
      });
      return;
    }

    // Delete the file
    const uploadsDir = process.env.UPLOAD_DIR || 'uploads';
    const filePath = path.join(uploadsDir, filename);

    // Verify file is in uploads directory (security)
    const realPath = fs.realpathSync(filePath);
    const uploadsRealPath = fs.realpathSync(uploadsDir);

    if (!realPath.startsWith(uploadsRealPath)) {
      res.status(400).json({ message: 'Invalid file path' });
      return;
    }

    fs.unlinkSync(filePath);

    res.json({
      message: 'Image deleted successfully',
      filename
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// AUDIT LOGS
// GET /api/admin/audit-logs
router.get('/audit-logs', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'username', 'role'] }],
      order: [['created_at', 'DESC']],
      limit: 500 // Limit to last 500 logs for performance
    });
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
