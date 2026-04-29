const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true 
        },
        role: { 
            type: DataTypes.STRING, 
            defaultValue: 'user' 
        },
        isEmailConfirmed: { 
            type: DataTypes.BOOLEAN, 
            defaultValue: false 
        },
        confirmationToken: { 
            type: DataTypes.STRING, 
            allowNull: true 
        },
        resetPasswordToken: { 
            type: DataTypes.STRING, 
            allowNull: true 
        },
        refreshToken: { 
            type: DataTypes.STRING, 
            allowNull: true 
        },
        // --- ПЕРЕНОСИМО СЮДИ ---
        createdAt: {
            type: DataTypes.DATE,
            allowNull: true
        },
        updatedAt: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'users', 
        timestamps: true // Залишаємо true, щоб Sequelize ними керував
    });

    return User;
};