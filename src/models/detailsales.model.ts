import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface DetailAttributes {
    ID_Detalle: number;
    ID_Venta: number;
    ID_Ejemplar: number;
    Cantidad: number;
    Precio: number;
}

// Atributos opcionales para la creación de un usuario
interface DetailCreationAttributes extends Optional<DetailAttributes, 'ID_Detalle'> {}

// Definición de la clase de modelo
class Detail extends Model<DetailAttributes, DetailCreationAttributes> implements DetailAttributes {
    public ID_Detalle!: number;
    public ID_Venta!: number;
    public ID_Ejemplar!: number;
    public Cantidad!: number;
    public Precio!: number;
}

// Inicialización del modelo
Detail.init({
    ID_Detalle: {
        type: DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    ID_Venta: {
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
    },
    Precio: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    
}, {
    sequelize,
    tableName: 'Detalle_Venta', // Cambiado a 'Libros' si es la tabla correspondiente
    timestamps: false,
});

export { Detail };
