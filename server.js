const express = require('express');
const path = require('path');
const db = require('./models/index'); 
const app = express();

// --- 1. НАЛАШТУВАННЯ СЕРВЕРА ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Підключення статичних папок
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));


app.use('/scrin', express.static(path.join(__dirname, 'scrin')));

app.get('/', async (req, res) => {
    try {
        const products = await db.Product.findAll();
        const categories = await db.Category.findAll();
        res.render('index', { products, categories });
    } catch (err) {
        console.error("Помилка завантаження головної:", err);
        res.status(500).send("Помилка бази даних");
    }
});

app.get('/admin', async (req, res) => {
    try {
        const products = await db.Product.findAll();
        res.render('admin', { products });
    } catch (err) {
        res.status(500).send("Не вдалося відкрити адмінку");
    }
});

app.get('/auth', (req, res) => {
    res.render('auth');
});

app.post('/add-product', async (req, res) => {
    try {
        const { name, price, image } = req.body;
        await db.Product.create({ 
            name, 
            price, 
            image: image || 'product-1.png' 
        });
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send("Помилка при додаванні");
    }
});

app.post('/delete-product/:id', async (req, res) => {
    try {
        await db.Product.destroy({ where: { id: req.params.id } });
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send("Помилка при видаленні");
    }
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        await db.User.create({ 
            username: username || email.split('@')[0], 
            email, 
            password: password || 'password123' 
        });
        res.redirect('/');
    } catch (err) {
        res.status(500).send("Помилка реєстрації");
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.User.findOne({ where: { email, password } });
        if (user) {
            res.redirect('/');
        } else {
            res.status(401).send("Невірні дані");
        }
    } catch (err) {
        res.status(500).send("Помилка входу");
    }
});

const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        console.log(' MySQL підключено успішно');

        await db.sequelize.sync({ alter: true });
        console.log(' База синхронізована');

        const PORT = 5000;
        app.listen(PORT, () => {
            console.log(`Сервер на http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error(' Помилка:', err);
    }
};
app.get('/', async (req, res) => {
    try {
        const products = await db.Product.findAll();
        // ДОДАЙ ЦЕЙ РЯДОК:
        console.log("Дані першого продукту:", products[0] ? products[0].dataValues : "Немає продуктів");
        
        const categories = await db.Category.findAll();
        res.render('index', { products, categories });
    } catch (err) {
        console.error("Помилка:", err);
        res.status(500).send("Помилка бази даних");
    }
});
app.get('/', async (req, res) => {
    try {
        const products = await db.Product.findAll();
        
        if (products.length > 0) {
            console.log("--- ПЕРЕВІРКА ОБ'ЄКТА ТОВАРУ ---");
            console.log("Доступні поля:", Object.keys(products[0].dataValues));
            console.log("Значення image:", products[0].image);
            console.log("-------------------------------");
        }

        const categories = await db.Category.findAll();
        res.render('index', { products, categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Помилка");
    }
});
startServer();