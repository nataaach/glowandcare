module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Product', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        image: {
            type: DataTypes.STRING,
            allowNull: true
        },
        composition: DataTypes.TEXT,
        volume: DataTypes.STRING,
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: true
        }
    }, {
        tableName: 'products',
        timestamps: false
    });
};