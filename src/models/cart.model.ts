import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface CarritoAttributes {
    ID: number;
    ID_Usuario:number;
    ID_Libro: string;
    Cantidad: number; 
}

// Atributos opcionales para la creación de un usuario
interface CarritoCreationAttributes extends Optional<CarritoAttributes, 'ID'> {}

// Definición de la clase de modelo
class Carrito extends Model<CarritoAttributes, CarritoCreationAttributes> implements CarritoAttributes {
    public ID!: number;
    public ID_Usuario!:number;
    public ID_Libro!: string;
    public Cantidad!: number;
}

// Inicialización del modelo
Carrito.init({
    ID: {
        type: DataTypes.INTEGER, // Cambiado a STRING si el ID del libro es un texto
        autoIncrement: true,
        primaryKey: true
    },
    ID_Usuario: {
        type: DataTypes.INTEGER, // Cambiado a STRING si el ID del libro es un texto
        allowNull: false
    },
    ID_Libro: {
        type: DataTypes.STRING, // Cambiado a STRING si el ID del libro es un texto
        allowNull: false
    },
    Cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    sequelize,
    tableName: 'Carrito', // Cambiado a 'Libros' si es la tabla correspondiente
    timestamps: false,
});

export { Carrito };
