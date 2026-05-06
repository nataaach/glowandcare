const express = require('express');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit'); 
const jwt = require('jsonwebtoken'); 
const bcrypt = require('bcryptjs'); 
const { OAuth2Client } = require('google-auth-library'); 
const db = require('./models/index'); 
const app = express();

const SECRET_KEY = "glow_and_care_secret_2026"; 
const REFRESH_SECRET = "glow_and_care_refresh_secret"; 
const googleClient = new OAuth2Client("YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"); 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/scrin', express.static(path.join(__dirname, 'scrin')));

// --- ЗАВДАННЯ 13. Логування помилок ---
const logError = (error) => {
    const logMessage = `${new Date().toISOString()} - ${error.message}\n`;
    fs.appendFileSync("error.log", logMessage);
    console.error(error);
};

// --- ЗАВДАННЯ 14. Обмеження спроб входу ---
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 5, 
    message: "Забагато спроб входу. Спробуйте знову через 15 хвилин.",
    standardHeaders: true, 
    legacyHeaders: false,
});

// --- ЗАВДАННЯ 15. Перевірка токена ---
const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Немає токена" });

    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        logError(err); 
        res.status(401).json({ message: "Недійсний токен" });
    }
};

// --- МАРШРУТИ ---

app.get('/', async (req, res) => {
    try {
        const products = await db.Product.findAll();
        const categories = await db.Category.findAll();
        res.render('index', { products, categories });
    } catch (err) {
        logError(err); 
        res.status(500).send("Помилка бази даних");
    }
});

app.get('/admin', authenticateToken, async (req, res) => {
    try {
        const products = await db.Product.findAll();
        res.render('admin', { products });
    } catch (err) {
        logError(err); 
        res.status(500).send("Не вдалося відкрити адмінку");
    }
});
//ЗАВДАННЯ 17. 
app.delete("/profile/delete", authenticateToken, async (req, res) => {
    try {
        const { password } = req.body; 

        const user = await db.User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Користувача не знайдено" });
        }

        if (password) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: "Пароль невірний. Видалення скасовано." });
            }
        }
        await user.destroy();

        res.json({ message: "Обліковий запис успішно видалено." });
    } catch (err) {
        logError(err);
        res.status(500).json({ message: "Помилка при видаленні акаунта" });
    }
});
//ЗАВДАННЯ 16
app.post("/profile/change-password", authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword, confirmNewPassword } = req.body;

        if (!oldPassword || !newPassword || !confirmNewPassword) {
            return res.status(400).json({ message: "Будь ласка, заповніть усі поля" });
        }

        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ message: "Нові паролі не збігаються" });
        }
        const user = await db.User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Користувача не знайдено" });
        }
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Поточний пароль введено невірно" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Пароль успішно змінено!" });

    } catch (err) {
        logError(err); 
        res.status(500).json({ message: "Помилка при зміні пароля" });
    }
});
//ЗАВДАННЯ 10. 
app.put("/profile/update", authenticateToken, async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "Користувача не знайдено" });
        }
        if (username) user.username = username;

        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        res.json({ 
            message: "Профіль успішно оновлено",
            user: { username: user.username, email: user.email }
        });
    } catch (err) {
        logError(err); 
        res.status(500).json({ message: "Помилка при оновленні профілю" });
    }
});
// --- ЗАВДАННЯ 4.
app.get("/profile", authenticateToken, async (req, res) => {
    try {
        const user = await db.User.findByPk(req.user.id, { 
            attributes: ['username', 'email', 'role'] 
        });
        
        if (!user) return res.status(404).json({ message: "Користувача не знайдено" });
        
        res.json(user);
    } catch (err) {
        logError(err);
        res.status(500).json({ message: "Помилка сервера" });
    }
});
// --- ЗАВДАННЯ 2, 3, 7. Реєстрація ---
app.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword } = req.body;

        if (!username || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "Всі поля обов'язкові" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Паролі не співпадають" });
        }

        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: "Email вже існує" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const confirmToken = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1d' });

        const userCount = await db.User.count();
        await db.User.create({ 
            username, 
            email, 
            password: hashedPassword,
            role: userCount === 0 ? 'admin' : 'user', 
            confirmationToken: confirmToken,
            isEmailConfirmed: false 
        });

        console.log(`[EMAIL SIMULATION]: Підтвердіть пошту: http://localhost:5000/confirm/${confirmToken}`);
        res.status(201).json({ message: "Користувача створено. Перевірте email." });
    } catch (err) {
        logError(err); 
        res.status(500).send("Помилка реєстрації");
    }
});


app.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.User.findOne({ where: { email } });

        if (user && await bcrypt.compare(password, user.password)) {
            if (!user.isEmailConfirmed) {
                return res.status(403).json({ message: "Будь ласка, підтвердіть вашу пошту!" });
            }
            const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
            
            const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: '7d' });
            
            // Зберігаємо refresh токен у базу
            await user.update({ refreshToken });

            res.json({ message: "Успішний вхід", token, refreshToken });
        } else {
            res.status(401).send("Невірні дані");
        }
    } catch (err) {
        logError(err); 
        res.status(500).send("Помилка входу");
    }
});
// --- ЗАВДАННЯ 18.
app.post("/forgot-password", async (req, res) => {
    try {
        const user = await db.User.findOne({ where: { email: req.body.email } });
        
        if (user) {
            const resetToken = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' });
            user.resetPasswordToken = resetToken;
            await user.save();
            
            console.log(`\x1b[33m%s\x1b[0m`, `[EMAIL SEND]: Відновлення пароля для ${user.email}: http://localhost:5000/reset-password/${resetToken}`);
        }

        res.json({ message: "Якщо email існує, ми надіслали інструкції." });
    } catch (err) {
        logError(err);
        res.status(500).json({ message: "Помилка сервера" });
    }
});

app.post("/reset-password/:token", async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        const decoded = jwt.verify(token, SECRET_KEY);
        
        const user = await db.User.findOne({ where: { id: decoded.id, resetPasswordToken: token } });

        if (!user) {
            return res.status(400).json({ message: "Токен недійсний або застарілий" });
        }
        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = null;
        await user.save();

        res.json({ message: "Пароль успішно змінено! Тепер ви можете увійти." });
    } catch (err) {
        logError(err);
        res.status(400).json({ message: "Помилка: токен прострочений або невірний" });
    }
});

//ЗАВДАННЯ 12
app.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: "Refresh Token відсутній" });

    try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = await db.User.findOne({ where: { id: decoded.id, refreshToken } });

        if (!user) return res.status(403).json({ message: "Недійсний Refresh Token" });

        const newToken = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token: newToken });
    } catch (err) {
        logError(err);
        res.status(403).json({ message: "Помилка оновлення токена" });
    }
});
//ЗАВДАННЯ 9
app.post("/logout", authenticateToken, async (req, res) => {
    try {
        const user = await db.User.findByPk(req.user.id);

        if (user) {
            await user.update({ refreshToken: null });
            
            res.json({ message: "Вихід успішний. Токен анульовано." });
        } else {
            res.status(404).json({ message: "Користувача не знайдено" });
        }
    } catch (err) {
        logError(err); 
        res.status(500).json({ message: "Помилка при виході з системи" });
    }
});
// ЗАВДАННЯ 19. 
app.get("/confirm/:token", async (req, res) => {
    try {
        const user = await db.User.findOne({ where: { confirmationToken: req.params.token } });
        if (!user) return res.status(400).send("Недійсний або прострочений токен");
        
        user.isEmailConfirmed = true;
        user.confirmationToken = null;
        await user.save();
        
        res.send("<h1>Email успішно підтверджено!</h1><p>Тепер ви можете увійти у свій акаунт.</p>");
    } catch (error) {
        logError(error); 
        res.status(500).send("Помилка підтвердження");
    }
});

//ЗАВДАННЯ 20. 
app.post('/api/auth/google', async (req, res) => {
    try {
        const { idToken } = req.body;
        const ticket = await googleClient.verifyIdToken({ idToken, audience: "YOUR_GOOGLE_CLIENT_ID" });
        const { email, name } = ticket.getPayload();

        let user = await db.User.findOne({ where: { email } });
        if (!user) {
            user = await db.User.create({ username: name, email, password: null, role: 'user', isEmailConfirmed: true });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: "Google вхід успішний", token });
    } catch (err) {
        logError(err);
        res.status(400).json({ message: "Помилка Google авторизації" });
    }
});

// Продукти
app.post('/add-product', async (req, res) => {
    try {
        const { name, price, image } = req.body;
        await db.Product.create({ name, price, image: image || 'product-1.png' });
        res.redirect('/admin');
    } catch (err) { logError(err); res.status(500).send("Помилка"); }
});

app.post('/delete-product/:id', async (req, res) => {
    try {
        await db.Product.destroy({ where: { id: req.params.id } });
        res.redirect('/admin');
    } catch (err) { logError(err); res.status(500).send("Помилка"); }
});

const startServer = async () => {
    try {
        await db.sequelize.authenticate();
        console.log(' MySQL підключено');
        await db.sequelize.sync({ alter: true });
        const PORT = 5000;
        app.listen(PORT, () => console.log(` Сервер: http://localhost:${PORT}`));
    } catch (err) { logError(err); }
};

startServer();