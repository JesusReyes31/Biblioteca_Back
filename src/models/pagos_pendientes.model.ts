import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface Pago_PendienteAttributes {
    ID: number;
    Codigo: string;
    ID_Usuario: number;
    ID_Venta: number;
}

// Atributos opcionales para la creación de un usuario
interface Pago_PendienteCreationAttributes extends Optional<Pago_PendienteAttributes, 'ID'> {}

// Definición de la clase de modelo
class Pago_Pendiente extends Model<Pago_PendienteAttributes, Pago_PendienteCreationAttributes> implements Pago_PendienteAttributes {
    public ID!: number;
    public Codigo!: string;
    public ID_Usuario!: number;
    public ID_Venta!: number;
}

// Inicialización del modelo
Pago_Pendiente.init({
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement:true,
        primaryKey:true
    },
    Codigo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ID_Venta: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
}, {
    sequelize,
    tableName: 'Pagos_Pendientes',
    timestamps: false,
});

export { Pago_Pendiente };
