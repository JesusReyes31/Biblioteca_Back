import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

interface NotificacionAttributes {
    ID: number;
    ID_Usuario: number;
    Mensaje: string;
    Tipo: 'Prestamo' | 'Reserva' | 'Venta' | 'Sistema';
    Leido: boolean;
    Fecha: Date;
}

interface NotificacionCreationAttributes extends Optional<NotificacionAttributes, 'ID'> {}

class Notificacion extends Model<NotificacionAttributes, NotificacionCreationAttributes> 
implements NotificacionAttributes {
    public ID!: number;
    public ID_Usuario!: number;
    public Mensaje!: string;
    public Tipo!: 'Prestamo' | 'Reserva' | 'Venta' | 'Sistema';
    public Leido!: boolean;
    public Fecha!: Date;
}

Notificacion.init({
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Mensaje: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Tipo: {
        type: DataTypes.ENUM('Prestamo', 'Reserva', 'Venta', 'Sistema'),
        allowNull: false
    },
    Leido: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    Fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    sequelize,
    tableName: 'Notificaciones',
    timestamps: false
});

export { Notificacion };
