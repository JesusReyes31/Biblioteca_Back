import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface PrestamosAttribute {
    ID_Prestamo:number;
    ID_Ejemplar: number;
    ID_Usuario: number;
    Fecha_prestamo: Date;
    Fecha_devolucion_prevista:Date;
    Estado: "Pendiente" | "Devuelto";
}

// Atributos opcionales para la creación de un usuario
interface PrestamosCreationAttributes extends Optional<PrestamosAttribute, 'ID_Prestamo'> {}

// Definición de la clase de modelo
class Prestamos extends Model<PrestamosAttribute, PrestamosCreationAttributes> implements PrestamosAttribute {
    public ID_Prestamo!: number;
    public ID_Ejemplar!: number;
    public ID_Usuario!: number;
    public Fecha_prestamo!: Date;
    public Fecha_devolucion_prevista!: Date;
    public Estado!: "Pendiente" | "Devuelto";
}

// Inicialización del modelo
Prestamos.init({
    ID_Prestamo:{
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement:true
    },
    ID_Ejemplar: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Fecha_prestamo: {
        type: DataTypes.DATE,
        allowNull: false
    },
    Fecha_devolucion_prevista: {
        type: DataTypes.DATE,
        allowNull: false
    },
    Estado: {
        type: DataTypes.ENUM("Pendiente" , "Devuelto"),
        allowNull: false,
        defaultValue: "Pendiente"
    },
    
}, {
    sequelize,
    tableName: 'Prestamos', // Cambiado a 'Libros' si es la tabla correspondiente
    timestamps: false,
});

export { Prestamos };
