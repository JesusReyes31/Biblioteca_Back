import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../config/sql';
import { user } from './users.model';

interface TokenAttributes {
    ID: number;
    ID_Usuario: number;
    Token: string;
    Usado: boolean;
}

class ActivationToken extends Model<TokenAttributes> implements TokenAttributes {
    public ID!: number;
    public ID_Usuario!: number;
    public Token!: string;
    public Usado!: boolean;
}

ActivationToken.init({
    ID: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    ID_Usuario: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: user,
            key: 'ID'
        }
    },
    Token: {
        type: DataTypes.STRING(2000),
        allowNull: false
    },
    Usado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    sequelize,
    tableName: 'Tokens_Activacion',
    timestamps: false
});

export { ActivationToken };