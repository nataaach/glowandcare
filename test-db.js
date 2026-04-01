const { sequelize, Category, Product } = require('./models/index');
const mysql = require('mysql2/promise');

async function testAll() {
    let connection;
    try {
        console.log('--- ТЕСТУВАННЯ РОЗПОЧАТО ---');

        // 1. Тест mysql2 (Raw SQL)
        connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'cosmetics_shop_db'
        });
        await connection.execute("SET SESSION sql_mode = ''");
        console.log(' З\'єднання через mysql2 (Raw SQL) успішне.');

        // 2. Тест Sequelize (ORM)
        await sequelize.authenticate();
        console.log(' З\'єднання через Sequelize (ORM) успішне.');

        // 3. Тест отримання даних
        const categories = await Category.findAll();
        console.log(`ORM працює. Знайдено категорій: ${categories.length}`);
        
        if (categories.length > 0) {
            console.log('Назва першої категорії:', categories[0].category_name);
        }

    } catch (error) {
        console.error('ПОМИЛКА:', error.message);
        // Тест зв'язку One-to-Many
const products = await Product.findAll({ 
    include: [{ model: Category, as: 'category' }] 
});
console.log(` Зв'язок працює. Знайдено товарів з категоріями: ${products.length}`);
    } finally {
        if (connection) await connection.end();
        await sequelize.close();
        process.exit();
    }
}

testAll();