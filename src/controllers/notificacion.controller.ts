import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Notificacion } from "../models/notificaciones.model";
import { Op } from "sequelize";
import { io } from "../app";

const getNotifications = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const notifications = await Notificacion.findAll({
            where: { 
                ID_Usuario: parseInt(id),
                Fecha: {
                    [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // últimos 30 días
                }
            },
            order: [
                ['Fecha', 'DESC']
            ],
            limit: 50 // limitar a 50 notificaciones
        });
        
        res.status(200).json(notifications);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_NOTIFICATIONS');
    }
};

const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Notificacion.update(
            { Leido: true },
            { where: { ID: parseInt(id) } }
        );
        res.status(200).json({ message: "Notificación marcada como leída" });
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATE_NOTIFICATION');
    }
};

const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        await Notificacion.update(
            { Leido: true },
            { where: { ID_Usuario: parseInt(userId), Leido: false } }
        );
        res.status(200).json({ message: "Todas las notificaciones marcadas como leídas" });
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATE_NOTIFICATIONS');
    }
};

const createNotification = async (req: Request, res: Response) => {
    try {
      const { ID_Usuario, Mensaje, Tipo } = req.body;
      const notification = await Notificacion.create({
        ID_Usuario,
        Mensaje,
        Tipo,
        Leido: false,
        Fecha: new Date()
      });
  
      // Emitir evento a través de Socket.IO
      io.to(`user_${ID_Usuario}`).emit(`newNotification_${ID_Usuario}`);
  
      res.status(201).json(notification);
    } catch (error) {
      handleHttp(res, 'ERROR_CREATE_NOTIFICATION', error);
    }
  };

export { getNotifications, markAsRead, markAllAsRead,createNotification };
