import "dotenv/config";
const sql = require('mssql');
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_HOST, 
    database: process.env.DB_NAME,
    options: {
        encrypt: true,
        trustServerCertificate: true 
    }
};
export async function dbConnect() {
    try {
        const pool = await sql.connect(config);
        return pool;
    } catch (err) {
        console.error('Error al conectar a la base de datos:', err);
        throw err;
    }
}

import { Sequelize } from "sequelize";
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME as string,
    process.env.DB_USER as string,
    process.env.DB_PASSWORD as string,{
        host: process.env.DB_HOST,
        dialect: 'mssql',
        timezone: '-07:00', //Zona horaria Mazatlan
        dialectOptions: {
            options: {
                useUTC: false,
                dateFirst: 1,
            }
        }
    }
)
const checkConnection = async() => {
    try{
        await sequelize.authenticate();
        console.log("conexion exitosa");
    }catch(error){
        console.log("no hay conexion", error);
    }
}
checkConnection();
export { sequelize, checkConnection };
