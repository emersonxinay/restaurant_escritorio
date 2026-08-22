import { Router, Response } from 'express';
import { Category, Product, Discount } from '../models';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { getImageUrl } from '../utils/imageProcessor';
import { saveBackup, loadBackup } from '../utils/backupService';

const router = Router();

// GET /api/public/home
router.get('/home', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await Category.findAll();
    const products = await Product.findAll({
      include: [{ association: 'category', attributes: ['id', 'name'] }]
    });

    const productsByCategory: any = {};
    categories.forEach(category => {
      productsByCategory[category.name] = products
        .filter(p => p.category_id === category.id)
        .map(p => ({
          ...p.toJSON(),
          image_url: getImageUrl(p.image_url || 'logofavicon.png')
        }));
    });

    // Obtener descuento activo
    const activeDiscount = await Discount.findOne({
      where: { is_active: true }
    });

    const responseData = {
      categories,
      products_by_category: productsByCategory,
      active_discount: activeDiscount ? activeDiscount.toJSON() : null
    };

    saveBackup('home.json', responseData);
    res.json(responseData);
  } catch (error: any) {
    try {
      const backupData = await loadBackup('home.json');
      res.json({ ...backupData, from_cache: true });
    } catch {
      res.status(500).json({ message: error.message });
    }
  }
});

// GET /api/public/nosotros
router.get('/nosotros', (req: any, res: Response) => {
  res.json({
    title: 'Nosotros',
    description: 'Información sobre el restaurante Hazuki'
  });
});

// GET /api/public/carta
router.get('/carta', async (req: any, res: Response) => {
  try {
    const categories = await Category.findAll();
    const products = await Product.findAll({
      include: [{ association: 'category', attributes: ['id', 'name'] }]
    });

    const productsByCategory: any = {};
    categories.forEach(category => {
      productsByCategory[category.name] = products
        .filter(p => p.category_id === category.id)
        .map(p => ({
          ...p.toJSON(),
          image_url: getImageUrl(p.image_url || 'logofavicon.png')
        }));
    });

    const responseData = {
      categories,
      products_by_category: productsByCategory
    };
    saveBackup('carta.json', responseData);
    res.json(responseData);
  } catch (error: any) {
    try {
      const backupData = await loadBackup('carta.json');
      res.json({ ...backupData, from_cache: true });
    } catch {
      res.status(500).json({ message: error.message });
    }
  }
});

// GET /api/public/promociones
router.get('/promociones', async (req: any, res: Response) => {
  try {
    const promoCategory = await Category.findOne({
      where: { name: 'Promociones' }
    });

    if (!promoCategory) {
      res.status(404).json({ message: 'Promotion category not found' });
      return;
    }

    const products = await Product.findAll({
      where: { category_id: promoCategory.id },
      include: [{ association: 'category', attributes: ['id', 'name'] }]
    });

    const productsWithImages = products.map(p => ({
      ...p.toJSON(),
      image_url: getImageUrl(p.image_url || 'logofavicon.png')
    }));

    const responseData = {
      category: promoCategory,
      products: productsWithImages
    };
    saveBackup('promociones.json', responseData);
    res.json(responseData);
  } catch (error: any) {
    try {
      const backupData = await loadBackup('promociones.json');
      res.json({ ...backupData, from_cache: true });
    } catch {
      res.status(500).json({ message: error.message });
    }
  }
});

// GET /api/public/menu-structure - Retorna estructura jerárquica de menú
router.get('/menu-structure', async (req: any, res: Response) => {
  try {
    // Obtener solo categorías principales (sin padre)
    const mainCategories = await Category.findAll({
      where: { parent_id: null },
      order: [['id', 'ASC']]
    });

    // Para cada categoría principal, obtener sus subcategorías y productos
    let menuStructure = await Promise.all(
      mainCategories.map(async (mainCat) => {
        // Obtener subcategorías
        const subcategories = await Category.findAll({
          where: { parent_id: mainCat.id },
          order: [['id', 'ASC']]
        });

        // Para cada subcategoría, obtener sus productos
        const subcategoriesWithProducts = await Promise.all(
          subcategories.map(async (subCat) => {
            const products = await Product.findAll({
              where: { category_id: subCat.id },
              order: [['id', 'ASC']]
            });

            return {
              id: subCat.id,
              name: subCat.name,
              parent_id: subCat.parent_id,
              products: products.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: p.price,
                image_url: getImageUrl(p.image_url || 'logofavicon.png'),
                category_id: p.category_id
              }))
            };
          })
        );

        return {
          id: mainCat.id,
          name: mainCat.name,
          parent_id: mainCat.parent_id,
          subcategories: subcategoriesWithProducts
        };
      })
    );

    // Filtrar solo categorías principales que tienen subcategorías con productos
    menuStructure = menuStructure.filter(mainCat =>
      mainCat.subcategories.some(subCat => subCat.products.length > 0)
    );

    const responseData = { menu_structure: menuStructure };
    saveBackup('menu-structure.json', responseData);
    res.json(responseData);
  } catch (error: any) {
    try {
      const backupData = await loadBackup('menu-structure.json');
      res.json({ ...backupData, from_cache: true });
    } catch {
      res.status(500).json({ message: error.message });
    }
  }
});

// GET /api/public/categories
router.get('/categories', async (req: any, res: Response) => {
  try {
    const categories = await Category.findAll();
    const responseData = { categories };
    saveBackup('categories.json', responseData);
    res.json(responseData);
  } catch (error: any) {
    try {
      const backupData = await loadBackup('categories.json');
      res.json({ ...backupData, from_cache: true });
    } catch {
      res.status(500).json({ message: error.message });
    }
  }
});

// GET /api/public/products
router.get('/products', async (req: any, res: Response) => {
  try {
    const categoryId = req.query.category_id;
    const where: any = {};

    if (categoryId) {
      where.category_id = categoryId;
    }

    const products = await Product.findAll({
      where,
      include: [{ association: 'category', attributes: ['id', 'name'] }]
    });

    const productsWithImages = products.map(p => ({
      ...p.toJSON(),
      image_url: getImageUrl(p.image_url || 'logofavicon.png')
    }));

    const responseData = { products: productsWithImages };
    saveBackup('products.json', responseData);
    res.json(responseData);
  } catch (error: any) {
    try {
      const backupData = await loadBackup('products.json');
      res.json({ ...backupData, from_cache: true });
    } catch {
      res.status(500).json({ message: error.message });
    }
  }
});

// GET /api/public/discounts
router.get('/discounts', async (_req: any, res: Response) => {
  try {
    const discounts = await Discount.findAll({
      where: { is_active: true },
      order: [['created_at', 'DESC']]
    });

    const discountsData = discounts.map(d => d.toJSON());
    const responseData = { discounts: discountsData };
    saveBackup('discounts.json', responseData);
    res.json(responseData);
  } catch (error: any) {
    try {
      const backupData = await loadBackup('discounts.json');
      res.json({ ...backupData, from_cache: true });
    } catch {
      res.status(500).json({ message: error.message });
    }
  }
});

// GET /api/public/discount/current
router.get('/discount/current', async (_req: any, res: Response) => {
  try {
    const discount = await Discount.findOne({
      where: { is_active: true }
    });

    if (!discount) {
      res.json({ discount: null });
      return;
    }

    discount.updateStatus();
    const responseData = { discount: discount.toJSON() };
    saveBackup('discount-current.json', responseData);
    res.json(responseData);
  } catch (error: any) {
    try {
      const backupData = await loadBackup('discount-current.json');
      res.json({ ...backupData, from_cache: true });
    } catch {
      res.status(500).json({ message: error.message });
    }
  }
});

export default router;
