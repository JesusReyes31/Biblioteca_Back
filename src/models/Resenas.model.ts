import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface ResenasAttribute {
    ID_Resena:number;
    ID_Libro: string;
    ID_Usuario: number;
    Calificacion: number;
    Fecha: Date;
    Descripcion:string;
}

// Atributos opcionales para la creación de un usuario
interface ResenasCreationAttributes extends Optional<ResenasAttribute, 'ID_Resena'> {}

// Definición de la clase de modelo
class Resenas extends Model<ResenasAttribute, ResenasCreationAttributes> implements ResenasAttribute {
    public ID_Resena!: number;
    public ID_Libro!: string;
    public ID_Usuario!: number;
    public Calificacion!: number;
    public Fecha!: Date;
    public Descripcion!: string;
}

// Inicialización del modelo
Resenas.init({
    ID_Resena:{
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Libro: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    Calificacion: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    Fecha: {
        type: DataTypes.DATE,
        allowNull: false
    },
    Descripcion: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'Resenas', // Cambiado a 'Libros' si es la tabla correspondiente
    timestamps: false,
});

export { Resenas };
