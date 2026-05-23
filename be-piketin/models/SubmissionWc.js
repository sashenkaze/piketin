'use strict';
const { 
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SubmissionWc extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      SubmissionWc.belongsTo(models.User, { foreignKey: 'user_id', as: 'User' });
      // as: harus sama dengan yang di User.hasMany di atas
      SubmissionWc.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'Reviewer' });
    }
  }
  SubmissionWc.init({
    user_id: DataTypes.BIGINT,
    reviewed_by: DataTypes.BIGINT,
    tanggal_piket: DataTypes.DATEONLY,
    tugas: DataTypes.ENUM('A', 'B'),
    status: {
      type: DataTypes.ENUM('Pending', 'Accepted', 'Declined'),
      defaultValue: 'Pending'
    },
    kondisi: DataTypes.ENUM('Bersih dan Rapi', 'Bersih', 'Kurang Bersih'),
    alasan_decline: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'SubmissionWc',
  });
  return SubmissionWc;
};