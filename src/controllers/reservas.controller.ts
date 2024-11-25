import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Reservas } from "../models/Reservas.model"; 
import { Book } from "../models/books.model";
import { user } from "../models/users.model";
import { Sequelize } from "sequelize";
import { Prestamos } from "../models/Prestamos.model";
import { Carrito } from "../models/cart.model";

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
    console.log('getReservasByID');
    try {
        const { id } = req.params;
        const Id = parseInt(id);
        // console.log(Id);
        const reservas = await Reservas.findAll({
            attributes: ['ID_Reserva',
                'ID_Libro',
                [Sequelize.col('Book.Titulo'), 'Titulo'],
                [Sequelize.col('Book.Imagen'), 'Imagen'],
                [Sequelize.col('Book.Autor'), 'Autor'],
                [
                    Sequelize.literal("CONVERT(VARCHAR(10), Reservas.Fecha_reserva, 120)"),
                    'fecha1'
                ],
                [
                    Sequelize.literal("CONVERT(VARCHAR(10), Reservas.Fecha_recoger, 120)"),
                    'fecha2'
                ],
            ],
            include: [
                {
                    model: Book,
                    attributes: [],
                },
            ],
            where: {
                ID_Usuario: Id,
            },
        });
        // console.log(reservas);
        res.status(200).json(reservas);
    } catch (error) {
        console.error('Error al obtener las reservas por ID:', error);
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
    const { ID_libro, ID_usuario } = req.body;
  
    const id = parseInt(ID_usuario); // Convierte el ID_usuario a entero
  
    if (isNaN(id)) {
      return res.status(400).json({ message: 'ID de usuario no válido' });
    }
  
    try {
      // Verificar si el usuario existe
      const usuario = await user.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Verificar el carrito para este libro
      const carritoItems = await Carrito.findAll({
        where: {
          ID_Libro: ID_libro
        }
      });

      for (const carritoItem of carritoItems) {
        if (carritoItem.Cantidad > 0) {
          // Disminuir la cantidad en el carrito
          await carritoItem.update({
            Cantidad: carritoItem.Cantidad - 1
          });
      
          // Si la cantidad llega a 0, eliminar el item del carrito
          if (carritoItem.Cantidad === 0) {
            await carritoItem.destroy();
          }
        }
      }

      // Verificar si existe un préstamo activo para este libro y usuario
      const prestamoActivo = await Prestamos.findOne({
        where: {
          ID_Libro: ID_libro,
          ID_Usuario: id,
          Estado: 'Pendiente' // Asumiendo que tienes un campo Estado en tu tabla de préstamos
        }
      });

      if (prestamoActivo) {
        return res.status(201).json({ 
          message: 'Ya tienes un préstamo activo para este libro, no puedes reservarlo 📚' 
        });
      }
      // Verificar la disponibilidad del libro
      const libro = await Book.findOne({
        where: {
          ID: ID_libro
        }
      });
      if (!libro || libro.Cantidad <= 0) {
        return res.status(201).json({ message: 'No se pudo realizar la reserva, el libro no está disponible 😞' });
      }
  
      // Crear la reserva
      const fechaReserva = new Date();
      const fechaRecoger = new Date(fechaReserva);
      fechaRecoger.setDate(fechaRecoger.getDate() + 1);
  
      const nuevaReserva = await Reservas.create({
        ID_Libro: ID_libro,
        ID_Usuario: id,
        Fecha_reserva: fechaReserva,
        Fecha_recoger: fechaRecoger,
      });
  
      // Reducir la cantidad de libros disponibles
      const nuevaCantidad = libro.Cantidad - 1;
      await libro.update({
        Cantidad: nuevaCantidad,
        Disponibilidad: nuevaCantidad > 0 ? 'Disponible' : 'No Disponible'
      });
  
      res.status(201).json({ message: 'exito', reserva: nuevaReserva });
    } catch (error) {
        console.log(error)
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
        // console.log(id)
        // Buscar la reserva a eliminar
        const reserva = await Reservas.findByPk(id);
        if (!reserva) {
            return res.status(404).json({ message: "No se encontró la Reserva" });
        }

        // Obtener el libro relacionado con la reserva
        const libro = await Book.findByPk(reserva.ID_Libro);
        if (!libro) {
            return res.status(404).json({ message: "No se encontró el libro relacionado con la reserva" });
        }

        // Aumentar la cantidad de libros disponibles
        const nuevaCantidad = libro.Cantidad + 1;

        // Actualizar la cantidad de libros y disponibilidad
        await libro.update({
            Cantidad: nuevaCantidad,
            Disponibilidad: nuevaCantidad > 0 ? 'Disponible' : 'No Disponible'
        });

        // Eliminar la reserva
        await reserva.destroy();

        res.json({ message: "Reserva eliminada correctamente y cantidad de libro actualizada." });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_RESERVA', error);
    }
}

export { getReserva,getReservasByID, getReservas, postReserva, putReserva, deleteReserva };
