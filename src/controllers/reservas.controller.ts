import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Reservas } from "../models/Reservas.model"; 
import { Book } from "../models/books.model";
import { user } from "../models/users.model";
import { Sequelize } from "sequelize";
import { Prestamos } from "../models/Prestamos.model";
import { Carrito } from "../models/cart.model";
import { Ejemplares } from "../models/ejemplares.model";
import { Sucursales } from "../models/sucursales.model";

const getReserva = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // console.log(id)
        const reserva = await Reservas.findByPk(id);
        return reserva ? res.json(reserva) : res.status(404).json({ message: "No se encontró la Reserva" });
    } catch (error) {
        handleHttp(res, 'ERROR_GET_RESERVA', error);
    }
}
const getReservasByID = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const Id = parseInt(id);
        const reservas = await Reservas.findAll({
            attributes: [
                'ID_Reserva',
                'ID_Ejemplar',
                'ID_Usuario',
                [Sequelize.col('Ejemplar.ID_Libro'), 'ID_Libro'],
                [Sequelize.col('Ejemplar.Book.Titulo'), 'Titulo'],
                [Sequelize.col('Ejemplar.Book.Imagen'), 'Imagen'],
                [Sequelize.col('Ejemplar.Book.Autor'), 'Autor'],
                [Sequelize.col('Ejemplar.Sucursales.Nombre'), 'Sucursal'],
                [
                    Sequelize.literal("CONVERT(VARCHAR(10), Reservas.Fecha_reserva, 120)"),
                    'fecha1'
                ],
                [
                    Sequelize.literal("CONVERT(VARCHAR(10), Reservas.Fecha_recoger, 120)"),
                    'fecha2'
                ],
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
            where: {
                ID_Usuario: Id,
            },
            order: [
                ['ID_Reserva', 'DESC'] // Agregamos el orden descendente
            ],
        });
        res.status(200).json(reservas);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_RESERVASBYID', error);
    }
};
const getReservas = async (req: Request, res: Response) => {
    try {
        const reservas = await Reservas.findAll();
        res.status(200).json(reservas);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_RESERVAS', error);
    }
}

const postReserva = async (req: Request, res: Response) => {
    const { ID_Ejemplar, ID_usuario } = req.body;
    const id = parseInt(ID_usuario);
    const idEjemplar = parseInt(ID_Ejemplar);
    
    if (isNaN(id)) {
        return res.status(400).json({ message: 'ID de usuario no válido' });
    }
  
    try {
        // Verificar si el usuario existe
        const usuario = await user.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar si ya existe una reserva para este ejemplar
        const reservaExistente = await Reservas.findOne({
            where: {
                ID_Ejemplar: idEjemplar,
                ID_Usuario: id
            }
        });

        if (reservaExistente) {
            return res.status(400).json({ 
                message: 'Ya tienes una reserva activa para este libro 📚' 
            });
        }

        // Verificar el número total de reservas del usuario
        const totalReservas = await Reservas.count({
            where: {
                ID_Usuario: id
            }
        });

        if (totalReservas >= 3) {
            return res.status(400).json({ 
                message: 'Has alcanzado el límite máximo de 3 reservas 📚' 
            });
        }

        // Verificar el carrito para este ejemplar
        const carritoItem = await Carrito.findOne({
            where: {
                ID_Ejemplar: idEjemplar,
                ID_Usuario: id
            }
        });

        if (carritoItem) {
            if (carritoItem.Cantidad > 0) {
                await carritoItem.update({
                    Cantidad: carritoItem.Cantidad - 1
                });
          
                if (carritoItem.Cantidad === 0) {
                    await carritoItem.destroy();
                }
            }
        }

        // Verificar si existe un préstamo activo
        const prestamoActivo = await Prestamos.findOne({
            where: {
                ID_Ejemplar: idEjemplar,
                ID_Usuario: id,
                Estado: 'Pendiente'
            }
        });

        if (prestamoActivo) {
            return res.status(400).json({ 
                message: 'Ya tienes un préstamo activo para este libro 📚' 
            });
        }

        // Verificar la disponibilidad del ejemplar
        const ejemplar = await Ejemplares.findByPk(idEjemplar);

        if (!ejemplar || ejemplar.Cantidad <= 0) {
            return res.status(400).json({ 
                message: 'No hay ejemplares disponibles 😞' 
            });
        }
  
        // Crear la reserva
        const fechaReserva = new Date();
        const fechaRecoger = new Date();
        fechaRecoger.setDate(fechaRecoger.getDate() + 1);
        const nuevaReserva = await Reservas.create({
            ID_Ejemplar: idEjemplar,
            ID_Usuario: id,
            Fecha_reserva: fechaReserva,
            Fecha_recoger: fechaRecoger,
        });
  
        // Reducir la cantidad de ejemplares disponibles
        await ejemplar.update({
            Cantidad: ejemplar.Cantidad - 1
        });
  
        res.status(201).json({ message: 'Reserva creada con éxito', reserva: nuevaReserva });
    } catch (error) {
        handleHttp(res, 'ERROR_POST_RESERVA', error);
    }
};
const putReserva = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const reservaData = req.body;
        const reserva = await Reservas.findByPk(id);
        if (!reserva) {
            return res.status(404).json({ message: "No se encontró la Reserva" });
        }
        await reserva.update(reservaData);
        res.json(reserva);
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATE_RESERVA', error);
    }
}

const deleteReserva = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const reserva = await Reservas.findByPk(id);
        if (!reserva) {
            return res.status(404).json({ message: "No se encontró la Reserva" });
        }

        // Obtener el ejemplar relacionado con la reserva
        const ejemplar = await Ejemplares.findByPk(reserva.ID_Ejemplar);
        if (!ejemplar) {
            return res.status(404).json({ message: "No se encontró el ejemplar relacionado con la reserva" });
        }

        // Aumentar la cantidad de ejemplares disponibles
        await ejemplar.update({
            Cantidad: ejemplar.Cantidad + 1
        });

        // Eliminar la reserva
        await reserva.destroy();

        res.json({ message: "Reserva eliminada correctamente y cantidad de ejemplares actualizada." });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_RESERVA', error);
    }
}

export { getReserva,getReservasByID, getReservas, postReserva, putReserva, deleteReserva };
