import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/sql';

// Definición de los atributos del usuario
interface TokensAttributes {
    ID_token: number;
    ID_Usuario: number;
    Token: string;
}

// Atributos opcionales para la creación de un usuario
interface TokensCreationAttributes extends Optional<TokensAttributes, 'ID_token'> {}

// Definición de la clase de modelo
class Tokens extends Model<TokensAttributes, TokensCreationAttributes> implements TokensAttributes {
    public ID_token!: number;
    public ID_Usuario!: number;
    public Token!: string;
}

// Inicialización del modelo
Tokens.init({
    ID_token: {
        type: DataTypes.INTEGER, // Cambiado a STRING si el ID del libro es un texto
        autoIncrement: true,
        primaryKey: true
    },
    ID_Usuario: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    Token: {
        type: DataTypes.STRING(2000),
        allowNull: false
    }
}, {
    sequelize,
    tableName: 'Tokens', // Cambiado a 'Libros' si es la tabla correspondiente
    timestamps: false,
});

export { Tokens };
