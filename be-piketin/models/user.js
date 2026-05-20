'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Submission, { foreignKey: 'user_id' });
    }
  }
  User.init({
    name: DataTypes.STRING,
    nis: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.ENUM('psrayon', 'murid'),
    jadwal_piket: DataTypes.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat')
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};