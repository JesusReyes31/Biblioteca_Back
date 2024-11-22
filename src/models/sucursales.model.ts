import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface SucursalesAttributes {
    ID: number;
    Nombre:string;
    Estado:string;
    Municipio:string;
    Colonia:string;
    Calle:string;
    CP:number;
    Tel_Contacto:string;
    ID_Usuario:number;
}

// Atributos opcionales para la creación de un usuario
interface SucursalesCreationAttributes extends Optional<SucursalesAttributes, 'ID'> {}

// Definición de la clase de modelo
class Sucursales extends Model<SucursalesAttributes, SucursalesCreationAttributes> implements SucursalesAttributes {
    public ID!: number;
    public Nombre!:string;
    public Estado!:string;
    public Municipio!:string;
    public Colonia!:string;
    public Calle!:string;
    public CP!:number;
    public Tel_Contacto!:string;
    public ID_Usuario!:number;
}

// Inicialización del modelo
Sucursales.init({
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    Nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Estado: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Municipio: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Colonia: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Calle: {
        type: DataTypes.STRING,
        allowNull: false
    },
    CP: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Tel_Contacto: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    sequelize,
    tableName: 'Sucursales', // Cambiado a 'Libros' si es la tabla correspondiente
    timestamps: false,
});

export { Sucursales };
