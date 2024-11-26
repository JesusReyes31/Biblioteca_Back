import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface PersonalAttributes {
    ID: number;
    ID_Usuario: number;
    ID_Sucursal: number;
}

// Atributos opcionales para la creación de un usuario
interface PersonalCreationAttributes extends Optional<PersonalAttributes, 'ID'> {}

// Definición de la clase de modelo
class Personal extends Model<PersonalAttributes, PersonalCreationAttributes> implements PersonalAttributes {
    public ID!: number;
    public ID_Usuario!: number;
    public ID_Sucursal!: number;
}

// Inicialización del modelo
Personal.init({
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ID_Sucursal: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    sequelize,
    tableName: 'Personal',
    timestamps: false,
});

export { Personal };
