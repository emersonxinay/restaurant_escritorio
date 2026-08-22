import sequelize from './src/config/database';
import Category from './src/models/Category';
import Product from './src/models/Product';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, 'import-products.json');

interface ImportData {
  categories: Array<{
    id: number;
    name: string;
    parent_id: number | null;
    subcategories?: Array<{ name: string }>;
  }>;
  products: Array<{
    name: string;
    description: string;
    price: number;
    category: string;
  }>;
}

async function importProducts() {
  try {
    console.log('Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('Sincronizando base de datos...');
    await sequelize.sync({ force: true });
    console.log('✓ Conexión y sincronización exitosa');

    console.log('\n⚠️  Eliminando datos existentes...');
    await Product.destroy({ where: {}, truncate: true, cascade: true });
    console.log('✓ Productos eliminados');

    await Category.destroy({ where: {}, truncate: true, cascade: true });
    console.log('✓ Categorías eliminadas');

    console.log('\nLeyendo archivo de importación...');
    const data: ImportData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    console.log('Creando categorías principales...');
    const categoryMap = new Map<string, number>();

    // Create main categories
    for (const mainCat of data.categories) {
      const [category] = await Category.findOrCreate({
        where: { name: mainCat.name, parent_id: null },
        defaults: { name: mainCat.name, parent_id: null }
      });
      categoryMap.set(mainCat.name, category.id);
      console.log(`  ✓ Categoría: ${mainCat.name} (ID: ${category.id})`);

      // Create subcategories
      if (mainCat.subcategories) {
        for (const subCat of mainCat.subcategories) {
          const [subcategory] = await Category.findOrCreate({
            where: { name: subCat.name, parent_id: category.id },
            defaults: { name: subCat.name, parent_id: category.id }
          });
          categoryMap.set(subCat.name, subcategory.id);
          console.log(`    ✓ Subcategoría: ${subCat.name} (ID: ${subcategory.id})`);
        }
      }
    }

    console.log('\nImportando productos...');
    let successCount = 0;
    let errorCount = 0;

    for (const prod of data.products) {
      try {
        const categoryId = categoryMap.get(prod.category);
        if (!categoryId) {
          console.log(`  ✗ ${prod.name} - Categoría no encontrada: ${prod.category}`);
          errorCount++;
          continue;
        }

        // Truncate name to 100 characters if necessary
        const productName = prod.name.substring(0, 100);

        await Product.findOrCreate({
          where: { name: productName, category_id: categoryId },
          defaults: {
            name: productName,
            description: prod.description || undefined,
            price: prod.price,
            category_id: categoryId,
            image_url: undefined
          }
        });

        console.log(`  ✓ ${productName} ($${prod.price}) → ${prod.category}`);
        successCount++;
      } catch (err: any) {
        console.log(`  ✗ ${prod.name} - Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n✓ Importación completada`);
    console.log(`  - Productos creados: ${successCount}`);
    console.log(`  - Errores: ${errorCount}`);
    console.log(`  - Total categorías: ${categoryMap.size}`);

    process.exit(0);
  } catch (error: any) {
    console.error('✗ Error durante la importación:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

importProducts();
