import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface MetodosPagoAttribute {
    ID:number;
    ID_Usuario: number;
    Nombre_Titular: string;
    Numero_Tarjeta: string;
    Fecha_Vencimiento: Date;
    CVV: string;
}

// Atributos opcionales para la creación de un usuario
interface MetodosPagoCreationAttributes extends Optional<MetodosPagoAttribute, 'ID'> {}

// Definición de la clase de modelo
class MetodosPago extends Model<MetodosPagoAttribute, MetodosPagoCreationAttributes> implements MetodosPagoAttribute {
    public ID!:number;
    public ID_Usuario!: number;
    public Nombre_Titular!: string;
    public Numero_Tarjeta!: string;
    public Fecha_Vencimiento!: Date;
    public CVV!: string;
}

// Inicialización del modelo
MetodosPago.init({
    ID:{
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement:true
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Nombre_Titular: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Numero_Tarjeta: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Fecha_Vencimiento: {
        type: DataTypes.DATE,
        allowNull: false
    },
    CVV: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    sequelize,
    tableName: 'Metodos_Pago', // Cambiado a 'Libros' si es la tabla correspondiente
    timestamps: false,
});

export { MetodosPago };
