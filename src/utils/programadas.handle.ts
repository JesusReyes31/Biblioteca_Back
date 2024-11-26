import cron from 'node-cron';
import { ActivationToken } from "../models/activation_tokens.model";
import { Book } from "../models/books.model";
import { Prestamos } from "../models/Prestamos.model";
import { user } from "../models/users.model";
import { Op, Sequelize } from "sequelize";
import { sendReminderEmail } from "./email.handle";

export const cleanupExpiredTokens = async () => {
    try {
        await ActivationToken.destroy({
            where: {
                Usado: true
            }
        });
    } catch (error) {
        console.error('Error al limpiar tokens expirados:', error);
    }
};

export const checkPrestamosVencimiento = async () => {
    try {
        const prestamosProximosVencer:any = await Prestamos.findAll({
            where: {
                Fecha_devolucion_prevista: {
                    [Op.and]: [
                        { [Op.gt]: new Date() }, // Fecha futura
                        { [Op.lte]: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) } // Próximos 2 días
                    ]
                },
                Estado: 'Pendiente' // O el estado que uses para préstamos vigentes
            },
            attributes: ['ID_Prestamo','Fecha_devolucion_prevista',[Sequelize.col('user.Correo'),'Correo'],[Sequelize.col('user.Nombre_completo'),'Nombre_completo'],[Sequelize.col('Book.Titulo'),'Titulo']],
            include: [
                {
                model: user,
                attributes: []
                },{
                    model: Book,
                    attributes: []
                }
            ],
            raw: true
        });

        for (const prestamo of prestamosProximosVencer) {
            const diasRestantes = Math.ceil(
                (new Date(prestamo.Fecha_devolucion_prevista).getTime() - new Date().getTime()) 
                / (1000 * 60 * 60 * 24)
            );
            const correo = {
                email: prestamo.Correo,
                nombre: prestamo.Nombre_completo,
                titulo_libro: prestamo.Titulo, // Ajusta según tu modelo
                fecha_devolucion: prestamo.Fecha_devolucion_prevista,
                dias_restantes: diasRestantes
            };
            // console.log(correo)
            await sendReminderEmail(correo);
        }
    } catch (error) {
        console.error('Error al verificar préstamos por vencer:', error);
    }
};

export const initScheduledJobs = () => {
    // Ejecutar la limpieza todos los días a las 08:00 am y 20:00 pm
    cron.schedule('0 8,20 * * *', async () => {
        console.log('Ejecutando limpieza de tokens...');
        await cleanupExpiredTokens();
    });

    // Ejecutar la verificación de préstamos todos los días a las 08:00 am y 20:00 pm
    cron.schedule('0 8,20 * * *', async () => {
        console.log('Verificando préstamos próximos a vencer...');
        await checkPrestamosVencimiento();
    });
};