import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Prestamos } from "../models/Prestamos.model"; 
import { user } from "../models/users.model";
import { Book } from "../models/books.model";
import { Reservas } from "../models/Reservas.model";
import { Op, Sequelize } from "sequelize";

//Prestamos Devueltos
const getPrestamosDevueltos = async (req: Request, res: Response) => {
    try {
        const { idUsuario, idLibro } = req.params;
        console.log(idUsuario,idLibro);
        const prestamos = await Prestamos.findAll({where:{ID_Usuario:parseInt(idUsuario),ID_Libro:idLibro,Estado:'Devuelto'}});
        console.log(prestamos);
        res.status(200).json(prestamos);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_PRESTAMOS_DEVUELTOS', error);
    }
}

//Prestamos de un usuario
const getPrestamo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(id);
        const prestamosData = await Prestamos.findAll({
            where: { ID_Usuario: parseInt(id) },
            attributes: [
                'ID_Prestamo',
                'ID_Libro',
                'ID_Usuario',
                'Fecha_prestamo',
                'Fecha_devolucion_prevista',
                'Estado',
                [Sequelize.col('Book.Titulo'), 'Titulo'] // Alias explícito
            ],
            include: [{
              model: Book, // Relacionar con el modelo de Book
              attributes: [] // Incluir solo el atributo 'Titulo'
            }],
            raw: true, // Devuelve un objeto plano
          });
          
          // Opcional: transformar los resultados para incluir solo lo necesario
          const prestamo = prestamosData.map(prestamo => ({
            ...prestamo,
            Fecha_prestamo: prestamo.Fecha_prestamo.toISOString().split('T')[0],
            Fecha_devolucion_prevista: prestamo.Fecha_devolucion_prevista.toISOString().split('T')[0]
          }));
          console.log(prestamo);
          return prestamosData.length > 0 
          ? res.json(prestamosData) 
          : res.status(404).json({ message: 'No se encontraron prestamos para este usuario.' });
    } catch (error) {
        handleHttp(res, 'ERROR_GET_PRESTAMO', error);
    }
}

//Prestamos para búsqueda
const getPrestamoSearch = async (req: Request, res: Response) => {
    try {
        const { search } = req.query; // Se espera un parámetro de búsqueda en la URL
        console.log(search);
        if (!search) {
            return res.status(400).json({ message: 'El parámetro de búsqueda es obligatorio.' });
        }
        // Buscar préstamos y relacionarlos con libros
        const prestamos = await Prestamos.findAll({
            include: [
                {
                    model: Book, // Modelo relacionado
                    as: 'Libro', // Alias configurado en la relación
                    attributes: ['Titulo'], // Trae solo el título del libro
                },
            ],
            where: {
                [Op.or]: [
                    { '$Libro.Titulo$': { [Op.like]: `%${search}%` } }, // Búsqueda por título del libro
                    Sequelize.where(Sequelize.fn('DATE_FORMAT', Sequelize.col('Fecha_prestamo'), '%Y-%m-%d'), {
                        [Op.like]: `%${search}%`,
                    }), // Búsqueda por fecha de préstamo (como cadena)
                    Sequelize.where(Sequelize.fn('DATE_FORMAT', Sequelize.col('Fecha_devolucion_prevista'), '%Y-%m-%d'), {
                        [Op.like]: `%${search}%`,
                    }), // Búsqueda por fecha de devolución (como cadena)
                    { Estado: { [Op.like]: `%${search}%` } }, // Búsqueda por estado
                ],
            },
        });
        return prestamos.length > 0
            ? res.json(prestamos)
            : res.status(404).json({ message: 'No se encontraron préstamos con los criterios especificados.' });
    } catch (error) {
        handleHttp(res, 'ERROR_GET_PRESTAMO', error);
    }
};


//Prestamos generales
const getPrestamos = async (req: Request, res: Response) => {
    try {
        const prestamos = await Prestamos.findAll({
            attributes: [
                'ID_Prestamo',
                'ID_Libro',
                'ID_Usuario',
                [
                    Sequelize.literal("CONVERT(VARCHAR(10), Prestamos.Fecha_prestamo, 120)"),
                    'Fecha_prestamo'
                ],
                [
                    Sequelize.literal("CONVERT(VARCHAR(10), Prestamos.Fecha_devolucion_prevista, 120)"),
                    'Fecha_devolucion_prevista'
                ],
                'Estado',
                [Sequelize.col('Book.Titulo'), 'Titulo'],  // Alias explícito para el título del libro
                [Sequelize.col('user.Nombre_Usuario'), 'Nombre_Usuario'] // Alias explícito para el nombre del usuario   
            ],
            include: [
                {
                    model: Book, // Relaciona con el modelo Book
                    attributes: [] // No necesitamos otros atributos de Book, solo Titulo
                },
                {
                    model: user, // Relaciona con el modelo Usuario
                    attributes: [] // No necesitamos otros atributos de Usuario, solo Nombre
                }
            ],
            raw: true, // Devuelve un objeto plano
        });
        res.status(200).json(prestamos);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_PRESTAMOS', error);
    }
}

const postPrestamo = async (req: Request, res: Response) => {
    const { idlibro, idusuario } = req.body;
    try {
        console.log(idlibro, idusuario);
        // Verificar si el usuario existe
        const usuario = await user.findByPk(idusuario);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar si el usuario ya tiene un préstamo activo del mismo libro
        const prestamoExistente = await Prestamos.findOne({
            where: {
                ID_Libro: idlibro,
                ID_Usuario: idusuario,
                Estado: 'Pendiente'
            }
        });

        if (prestamoExistente) {
            return res.status(400).json({ 
                message: 'Ya tienes este libro prestado. Debes devolverlo antes de poder prestarlo nuevamente 📚' 
            });
        }

        // Verificar si el libro está reservado
        const reserva = await Reservas.findOne({
            where: {
                ID_Libro: idlibro,
                ID_Usuario: idusuario
            }
        });

        let libro;

        if (reserva) {
            // Si el libro está reservado, no es necesario verificar la cantidad
            libro = await Book.findOne({
                where: {
                    ID: idlibro
                }
            });
            if (!libro) {
                return res.status(400).json({ message: 'Fallo, El libro no existe 😞' });
            }

            // Eliminar la reserva si se realiza el préstamo
            await reserva.destroy();
        } else {
            // Verificar la disponibilidad del libro y su cantidad
            libro = await Book.findOne({
                where: {
                    ID: idlibro
                }
            });
            if (!libro || libro.Cantidad <= 0) {
                return res.status(400).json({ message: 'Fallo, El libro ya no se encuentra disponible 😞' });
            }
        }

        // Crear el préstamo
        const fechaPrestamo = new Date();
        const fechaDevolucionPrevista = new Date(fechaPrestamo);
        fechaDevolucionPrevista.setDate(fechaDevolucionPrevista.getDate() + 7);
        const nuevoPrestamo = await Prestamos.create({
            ID_Libro: idlibro,
            ID_Usuario: idusuario,
            Fecha_prestamo: fechaPrestamo,
            Fecha_devolucion_prevista: fechaDevolucionPrevista,
            Estado: 'Pendiente',
        });
        
        // Reducir la cantidad de libros disponibles si no es un reservado
        if (!reserva) {
            const nuevaCantidad = libro.Cantidad - 1;

            // Actualizar la cantidad y disponibilidad del libro
            await libro.update({
                Cantidad: nuevaCantidad,
                Disponibilidad: nuevaCantidad > 0 ? 'Disponible' : 'No Disponible'
            });
        }

        res.status(201).json({ message: 'Libro prestado 😊', prestamo: nuevoPrestamo });
    } catch (error) {
        handleHttp(res, 'ERROR_POST_PRESTAMO', error);
    }
}

const putPrestamo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const prestamoData = req.body;
        console.log(id,prestamoData.ID_usuario);
        // Buscar el préstamo existente por ID_Libro
        const prestamo = await Prestamos.findOne({ where: { ID_Libro: id,ID_Usuario:prestamoData.ID_usuario, Estado: 'Pendiente' } });
        if (!prestamo) {
            return res.status(404).json({ message: "No se encontró el préstamo" });
        }
        // Buscar el libro correspondiente
        const libro = await Book.findOne({ where: { ID: id } });
        if (!libro) {
            return res.status(400).json({ message: 'Fallo, El libro no existe 😞' });
        }
        // Actualizar la Fecha_devolucion_prevista a la fecha actual
        const fechaDevolucion = new Date();
        await prestamo.update({
            Fecha_devolucion_prevista: fechaDevolucion,
            Estado: 'Devuelto' // Cambiar el estado a 'Devuelto'
        });
        // Aumentar la cantidad de libros disponibles
        const nuevaCantidad = libro.Cantidad + 1;
        const nuevaDisponibilidad = nuevaCantidad > 0 ? 'Disponible' : 'No Disponible';
        // Actualizar el libro
        await libro.update({
            Cantidad: nuevaCantidad,
            Disponibilidad: nuevaDisponibilidad
        });
        res.json({ message: 'Libro devuelto 😊', prestamo });
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATE_PRESTAMO', error);
    }
}


const deletePrestamo = async (req: Request, res: Response) => {
    try {
        const { id,idU } = req.params;
        const prestamo = await Prestamos.findOne({where:{ID_Libro:id,ID_Usuario:idU}});
        if (!prestamo) {
            return res.status(404).json({ message: "No se encontró el Prestamo" });
        }
        await prestamo.destroy();
        res.json({ message: "Prestamo eliminado correctamente" });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_PRESTAMO', error);
    }
}

export { getPrestamo,getPrestamoSearch, getPrestamos, getPrestamosDevueltos, postPrestamo, putPrestamo, deletePrestamo };
