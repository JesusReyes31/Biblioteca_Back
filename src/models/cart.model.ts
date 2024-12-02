import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del carrito
interface CarritoAttributes {
    ID: number;
    ID_Usuario: number;
    ID_Ejemplar: number;
    Cantidad: number; 
}

// Atributos opcionales para la creación
interface CarritoCreationAttributes extends Optional<CarritoAttributes, 'ID'> {}

// Definición de la clase de modelo
class Carrito extends Model<CarritoAttributes, CarritoCreationAttributes> implements CarritoAttributes {
    public ID!: number;
    public ID_Usuario!: number;
    public ID_Ejemplar!: number;
    public Cantidad!: number;
}

// Inicialización del modelo
Carrito.init({
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ID_Ejemplar: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'Carrito',
    timestamps: false
});

export { Carrito };
