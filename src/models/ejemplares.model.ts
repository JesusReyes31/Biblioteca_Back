import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';  // Asegúrate de que esta ruta es correcta

interface EjemplaresAttributes {
    ID: number;
    ID_Libro: string;
    ID_Sucursal: number;
    Cantidad: number;
    Precio: number;
    Estado: boolean;
}

interface EjemplaresCreationAttributes extends Optional<EjemplaresAttributes, 'ID'> {}

class Ejemplares extends Model<EjemplaresAttributes, EjemplaresCreationAttributes> implements EjemplaresAttributes {
    public ID!: number;
    public ID_Libro!: string;
    public ID_Sucursal!: number;
    public Cantidad!: number;
    public Precio!: number;
    public Estado!: boolean;
}

// Inicialización del modelo
Ejemplares.init(
    {
        ID: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        ID_Libro: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        ID_Sucursal: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        Cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        Precio: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        Estado: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
    },
    {
        sequelize,  // Asegúrate de pasar la instancia de sequelize aquí
        modelName: 'Ejemplares',
        tableName: 'Ejemplares',
        timestamps: false,
    }
);

export { Ejemplares };
