'use strict';
const { 
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Rayon extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
        Rayon.hasMany(models.User, { foreignKey: 'rayon_id' });
    }
    }
    Rayon.init({
    nama_rayon: DataTypes.STRING
    }, {
    sequelize,
    modelName: 'Rayon',
    // timestamps: false 
    });
    return Rayon;
};