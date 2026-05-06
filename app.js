const express = require('express');
const morgan = require('morgan'); 
const winston = require('winston'); 
const multer = require('multer'); 
const path = require('path'); 
const fs = require('fs');

const app = express();
const PORT = 3000;

// Автоматичне створення папки uploads, якщо її немає (щоб не було помилок)
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// ==========================================
// Завдання 3: Файлове логування подій (Winston)
// ==========================================
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'app.log' }), 
        new winston.transports.Console({ format: winston.format.simple() }) 
    ]
});

// ==========================================
// Завдання 2: Логування HTTP-запитів
// ==========================================
app.use(morgan('combined')); 

// ==========================================
// Завдання 9: Вимірювання часу відповіді
// ==========================================
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const msg = `[Performance] ${req.method} ${req.url} оброблено за ${duration}ms`;
        console.log(msg); 
        logger.info(msg);
    });
    next();
});

// ==========================================
// Завдання 7: Валідація файлів (Multer)
// ==========================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); 
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Дозволені лише файли форматів JPG, PNG та PDF!'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, 
    fileFilter: fileFilter
});


// ==========================================
// МАРШРУТИ (Endpoints)
// ==========================================

// Завдання 1: Ініціалізація
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Завдання 8: Моніторинг стану сервера
app.get('/status', (req, res) => {
    res.json({
        uptime: `${Math.floor(process.uptime())} секунд`,
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// Завдання 5: Завантаження одного файлу
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    res.send(`File uploaded successfully: ${req.file.filename}`);
});

// Завдання 6: Завантаження кількох файлів
app.post('/upload-multiple', upload.array('files', 5), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).send('No files uploaded.');
    }
    const fileNames = req.files.map(file => file.filename);
    res.send(`Успішно завантажено ${req.files.length} файлів: ${fileNames.join(', ')}`);
});

// Маршрут для перевірки обробника помилок
app.get('/error-test', (req, res) => {
    throw new Error('Штучна помилка для перевірки логгера!');
});

// ==========================================
// ОБРОБКА ПОМИЛОК
// ==========================================

// Обробка 404 (Маршрут не знайдено)
app.use((req, res, next) => {
    res.status(404).send("Sorry, can't find that!");
});

app.use((err, req, res, next) => {
    logger.error(`[ERROR] ${req.method} ${req.url} - ${err.message}`);

    if (err instanceof multer.MulterError) {
        return res.status(400).json({
            success: false,
            error: { code: 400, message: "Помилка завантаження файлу: " + err.message }
        });
    }

    // 2. Повернення користувачу JSON-відповіді
    res.status(500).json({
        success: false,
        error: {
            code: 500,
            message: err.message || 'Внутрішня помилка сервера'
        }
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
    logger.info('Server started'); 
});