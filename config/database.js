const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('cosmetics_shop_db', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});
module.exports = sequelize;