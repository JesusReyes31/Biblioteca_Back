import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';  // Asegúrate de que esta ruta es correcta

interface BookAttributes {
    ID: string;
    Titulo: string;
    Autor: string;
    Genero: string;
    ISBN: string;
    Anio_publicacion: number;
    Imagen: string;
    Resumen: string;
}

interface BookCreationAttributes extends Optional<BookAttributes, 'ID'> {}

class Book extends Model<BookAttributes, BookCreationAttributes> implements BookAttributes {
    public ID!: string;
    public Titulo!: string;
    public Autor!: string;
    public Genero!: string;
    public ISBN!: string;
    public Anio_publicacion!: number;
    public Imagen!: string;
    public Resumen!: string;
}

// Inicialización del modelo
Book.init(
    {
        ID: {
            type: DataTypes.STRING(100),
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
    },
    {
        sequelize,  // Asegúrate de pasar la instancia de sequelize aquí
        modelName: 'Book',
        tableName: 'Libros',
        timestamps: false,
    }
);

export { Book };
