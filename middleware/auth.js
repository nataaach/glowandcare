const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Немає токена" });

    try {
        const verified = jwt.verify(token.replace("Bearer ", ""), "secret"); 
        req.user = verified;
        next();
    } catch (err) {
        res.status(401).json({ message: "Недійсний токен" });
    }
};

module.exports = authenticateToken;