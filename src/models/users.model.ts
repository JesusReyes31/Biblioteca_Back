import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface UserAttributes {
    ID: number;
    Nombre_completo: string;
    Correo: string;
    Contra: string;
    CURP: string;
    Nombre_Usuario: string;
    Imagen?: string | null;
    Tipo_Usuario: string;
    Fecha_Registro: Date;
    Activo: boolean;
}

// Atributos opcionales para la creación de un usuario
interface UserCreationAttributes extends Optional<UserAttributes, 'ID'> {}

// Definición de la clase de modelo
class user extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public ID!: number;
    public Nombre_completo!: string;
    public Correo!: string;
    public Contra!: string;
    public CURP!: string;
    public Nombre_Usuario!: string;
    public Tipo_Usuario!:string;
    public Imagen!: string | null;
    public Fecha_Registro!: Date;
    public Activo!: boolean;
}

// Inicialización del modelo
user.init({
    ID: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre_completo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Correo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Contra: {
        type: DataTypes.STRING,
        allowNull: false
    },
    CURP: {
        type: DataTypes.STRING, // Asumiendo que CURP tiene 18 caracteres
        allowNull: false
    },
    Nombre_Usuario: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Imagen: {
        type: DataTypes.STRING(2000),
        allowNull: true
    },
    Tipo_Usuario: {
        type: DataTypes.STRING,
        allowNull: false
    },
    Fecha_Registro:{
        type: DataTypes.DATE,
        allowNull:false
    },
    Activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false  // Por defecto, el usuario estará inactivo
    }
}, {
    sequelize,
    tableName: 'Usuarios',
    timestamps: false,
});

export { user,UserAttributes };
