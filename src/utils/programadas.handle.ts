import cron from 'node-cron';
import { ActivationToken } from "../models/activation_tokens.model";
import { Book } from "../models/books.model";
import { Prestamos } from "../models/Prestamos.model";
import { user } from "../models/users.model";
import { Op, Sequelize } from "sequelize";
import { sendReminderEmail } from "./email.handle";
import { Notificacion } from "../models/notificaciones.model";
import { Reservas } from "../models/Reservas.model";
import { Ejemplares } from "../models/ejemplares.model";
import { Sucursales } from "../models/sucursales.model";

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
            // Crear notificación
            await Notificacion.create({
                ID_Usuario: prestamo.ID_Usuario,
                Mensaje: `Tu préstamo del libro "${prestamo.Titulo}" vence en ${diasRestantes} días`,
                Tipo: 'Prestamo',
                Fecha: new Date(),
                Leido: false // Agregado el campo requerido
            });
        }
    } catch (error) {
        console.error('Error al verificar préstamos por vencer:', error);
    }
};

export const checkReservasVencimiento = async () => {
    try {
        const reservasProximasVencer: any = await Reservas.findAll({
            where: {
                Fecha_recoger: {
                    [Op.and]: [
                        { [Op.gt]: new Date() }, // Fecha futura
                        { 
                            [Op.lte]: Sequelize.literal("DATEADD(hour, 24, GETDATE())") 
                        } // Próximas 24 horas
                    ]
                },
            },
            attributes: [
                'ID_Reserva',
                'ID_Usuario',
                'Fecha_recoger',
                [Sequelize.col('Ejemplar.Book.Titulo'), 'Titulo'],
                [Sequelize.col('Ejemplar.Sucursales.Nombre'), 'Sucursal']
            ],
            include: [{
                model: Ejemplares,
                as: 'Ejemplar',
                attributes: [],
                include: [{
                    model: Book,
                    attributes: []
                },
                {
                    model: Sucursales,
                    as: 'Sucursales',
                    attributes: []
                }]
            }],
            raw: true
        });

        for (const reserva of reservasProximasVencer) {
            const horasRestantes = Math.ceil(
                (new Date(reserva.Fecha_recoger).getTime() - new Date().getTime()) 
                / (1000 * 60 * 60)
            );

            // Personalizar mensaje según las horas restantes
            let mensaje;
            if (horasRestantes <= 1) {
                mensaje = `¡URGENTE! Tu reserva del libro "${reserva.Titulo}" en la sucursal ${reserva.Sucursal} vence en menos de una hora`;
            } else if (horasRestantes <= 3) {
                mensaje = `¡Importante! Tu reserva del libro "${reserva.Titulo}" en la sucursal ${reserva.Sucursal} vence en ${horasRestantes} horas`;
            } else {
                mensaje = `Tu reserva del libro "${reserva.Titulo}" en la sucursal ${reserva.Sucursal} vence en ${horasRestantes} horas`;
            }

            // Verificar si ya existe una notificación reciente para esta reserva
            const notificacionExistente = await Notificacion.findOne({
                where: {
                    ID_Usuario: reserva.ID_Usuario,
                    Tipo: 'Reserva',
                    Mensaje: {
                        [Op.like]: `%${reserva.Titulo}%`
                    },
                    Fecha: {
                        [Op.gte]: new Date(Date.now() - 3 * 60 * 60 * 1000) // Últimas 3 horas
                    }
                }
            });
            
            // Solo crear nueva notificación si no existe una reciente
            if (!notificacionExistente) {
                await Notificacion.create({
                    ID_Usuario: reserva.ID_Usuario,
                    Mensaje: mensaje,
                    Tipo: 'Reserva',
                    Fecha: new Date(),
                    Leido: false
                });
            }
        }
    } catch (error) {
        console.error('Error al verificar reservas por vencer:', error);
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

    // Verificar reservas cada hora
    cron.schedule('11 8,23 * * *', async () => {
        console.log('Verificando reservas próximas a vencer...');
        await checkReservasVencimiento();
    });
};