import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';  // Asegúrate de que esta ruta es correcta

interface BookAttributes {
    ID: string;
    Titulo: string;
    Autor: string;
    Genero: string;
    ISBN: string;
    Cantidad: number;
    Anio_publicacion: number;
    Imagen: string;
    Resumen: string;
    Disponibilidad: 'Disponible' | 'No Disponible';
    ID_Sucursal: number;
    Precio: number;
}

interface BookCreationAttributes extends Optional<BookAttributes, 'ID'> {}

class Book extends Model<BookAttributes, BookCreationAttributes> implements BookAttributes {
    public ID!: string;
    public Titulo!: string;
    public Autor!: string;
    public Genero!: string;
    public ISBN!: string;
    public Cantidad!: number;
    public Anio_publicacion!: number;
    public Imagen!: string;
    public Resumen!: string;
    public Disponibilidad!: 'Disponible' | 'No Disponible';
    public ID_Sucursal!: number;
    public Precio!: number;
}

// Inicialización del modelo
Book.init(
    {
        ID: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },
        Titulo: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        Autor: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        Genero: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        ISBN: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        Cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        Anio_publicacion: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        Imagen: {
            type: DataTypes.STRING(2000),
            allowNull: false,
        },
        Resumen: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        Disponibilidad: {
            type: DataTypes.ENUM('Disponible', 'No Disponible'),
            allowNull: false,
        },
        ID_Sucursal: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        Precio: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
    },
    {
        sequelize,  // Asegúrate de pasar la instancia de sequelize aquí
        modelName: 'Book',
        tableName: 'Libros',
        timestamps: false,
    }
);

export { Book };
