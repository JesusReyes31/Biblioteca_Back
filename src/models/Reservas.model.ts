import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';  // Asegúrate de que esta ruta es correcta
import { Book } from './books.model';  // Asegúrate de que Book esté importado correctamente

interface ReservasAttributes {
    ID_Reserva: number;
    ID_Libro: string;
    ID_Usuario: number;
    Fecha_reserva: Date;
    Fecha_recoger: Date;
}

interface ReservasCreationAttributes extends Optional<ReservasAttributes, 'ID_Reserva'> {}

class Reservas extends Model<ReservasAttributes, ReservasCreationAttributes> implements ReservasAttributes {
    public ID_Reserva!: number;
    public ID_Libro!: string;
    public ID_Usuario!: number;
    public Fecha_reserva!: Date;
    public Fecha_recoger!: Date;
}

// Inicialización del modelo
Reservas.init(
    {
        ID_Reserva: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        ID_Libro: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        ID_Usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        Fecha_reserva: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        Fecha_recoger: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Reservas',
        tableName: 'Reservas',
        timestamps: false,
    }
);

// Aquí es donde se define la relación
// Reservas.belongsTo(Book, { foreignKey: 'ID_Libro' });

export { Reservas };
