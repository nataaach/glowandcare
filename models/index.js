const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategoryInit = require('./Category');
const ProductInit = require('./Product');
const UserInit = require('./User');     
const OrderInit = require('./Order'); 


const Category = CategoryInit(sequelize, DataTypes);
const Product = ProductInit(sequelize, DataTypes);
const User = UserInit(sequelize, DataTypes);      
const Order = OrderInit(sequelize, DataTypes);     

// One-to-Many: Категорія -> Товари
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Product.belongsToMany(Order, { 
    through: 'OrderItems', 
    foreignKey: 'productId', 
    as: 'orders' 
});
Order.belongsToMany(Product, { 
    through: 'OrderItems', 
    foreignKey: 'orderId', 
    as: 'products' 
});

module.exports = {
    sequelize,
    Category,
    Product,
    User,
    Order
};