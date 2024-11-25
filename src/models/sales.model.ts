import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface VentaAttributes {
    ID_Venta: number;
    ID_Usuario: number;
    Fecha_Venta: Date; 
    Cantidad: number;
    Total: number;
    Entregado: "Si" | "No";
    ID_Metodo_Pago: number;
}

// Atributos opcionales para la creación de un usuario
interface VentaCreationAttributes extends Optional<VentaAttributes, 'ID_Venta'> {}

// Definición de la clase de modelo
class Venta extends Model<VentaAttributes, VentaCreationAttributes> implements VentaAttributes {
    public ID_Venta!: number;
    public Fecha_Venta!: Date;
    public ID_Usuario!: number;
    public Cantidad!: number;
    public Total!: number;
    public Entregado!:"Si" | "No";
    public ID_Metodo_Pago!: number;
}

// Inicialización del modelo
Venta.init({
    ID_Venta: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement:true,
        primaryKey: true
    },
    Fecha_Venta: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Total: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    Entregado: {
        type: DataTypes.ENUM("Si", "No"),
        allowNull: false,
        defaultValue: "No"
    },
    ID_Metodo_Pago: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
}, {
    sequelize,
    tableName: 'Ventas', 
    timestamps: false,
});

export { Venta };
