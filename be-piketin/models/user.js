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
      //! baru
      User.belongsTo(models.Rayon, { foreignKey: 'rayon_id'});
      User.hasMany(models.SubmissionWc, { foreignKey: 'user_id', as: 'SubmissionsWc' });
      //! self-ref: sbg petugas kokurikuler yg review
      User.hasMany(models.SubmissionWc, { foreignKey: 'reviewed_by', as: 'ReviewedSubmissions' });
    }
  }
  User.init({
    rayon_id: DataTypes.BIGINT,
    name: DataTypes.STRING,
    nis: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.ENUM('administrator', 'psrayon', 'kokurikuler', 'murid'),
    jadwal_piket: DataTypes.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'),
    minggu_ke: DataTypes.TINYINT,
    hari_wc: DataTypes.ENUM('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'),
    tugas_wc: DataTypes.ENUM('A', 'B')
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};