import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Prestamos } from "../models/Prestamos.model"; 
import { user } from "../models/users.model";
import { Book } from "../models/books.model";
import { Reservas } from "../models/Reservas.model";
import { Op, Sequelize } from "sequelize";
import { Sucursales } from "../models/sucursales.model";
import { Ejemplares } from "../models/ejemplares.model";

//Prestamos Devueltos
const getPrestamosDevueltos = async (req: Request, res: Response) => {
    try {
        const { idUsuario, idEjemplar } = req.params;
        const prestamos = await Prestamos.findAll({
            where: {
                ID_Usuario: parseInt(idUsuario),
                ID_Ejemplar: parseInt(idEjemplar),
                Estado: 'Devuelto'
            }
        });
        res.status(200).json(prestamos);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_PRESTAMOS_DEVUELTOS', error);
    }
}

//Prestamos de un usuario
const getPrestamo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const prestamosData = await Prestamos.findAll({
            where: { ID_Usuario: parseInt(id) },
            attributes: [
                'ID_Prestamo',
                'ID_Ejemplar',
                'ID_Usuario',
                'Fecha_prestamo',
                'Fecha_devolucion_prevista',
                'Estado',
                [Sequelize.col('Ejemplar.Book.Titulo'), 'Titulo'],
                [Sequelize.col('Ejemplar.Book.Autor'), 'Autor'],
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
                    as:'Sucursales',
                    attributes: []
                }]
            }],
            order: [
                ['ID_Prestamo', 'DESC'] // Agregamos el orden descendente
            ],
            raw: true
        });
          
        const prestamo = prestamosData.map(prestamo => ({
            ...prestamo,
            Fecha_prestamo: prestamo.Fecha_prestamo.toISOString().split('T')[0],
            Fecha_devolucion_prevista: prestamo.Fecha_devolucion_prevista.toISOString().split('T')[0]
        }));

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
                'ID_Ejemplar',
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
                [Sequelize.col('Ejemplar.Book.Titulo'), 'Titulo'],
                [Sequelize.col('user.Nombre_Usuario'), 'Nombre_Usuario'],
                [Sequelize.col('Ejemplar.Sucursales.Nombre'), 'Sucursal']
            ],
            include: [
                {
                    model: Ejemplares,
                    as: 'Ejemplar',
                    attributes: [],
                    where: {
                        ID_Sucursal: req.body.user.User.ID_Sucursal
                    },
                    include: [
                        {
                            model: Book,
                            attributes: []
                        },
                        {
                            model: Sucursales,
                            as: 'Sucursales',
                            attributes: []
                        }
                    ]
                },
                {
                    model: user,
                    attributes: []
                }
            ],
            raw: true,
        });
        res.status(200).json(prestamos);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_PRESTAMOS', error);
    }
}

const postPrestamo = async (req: Request, res: Response) => {
    const { idEjemplar, idusuario } = req.body;
    try {
        // Verificar si el usuario existe
        const usuario = await user.findByPk(idusuario);
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Verificar disponibilidad del ejemplar
        const ejmp = await Ejemplares.findByPk(idEjemplar);

        if (!ejmp || (ejmp.Cantidad <= 0)) {
            return res.status(400).json({ 
                message: 'No hay ejemplares disponibles en esta sucursal 😞' 
            });
        }

        const Sucursal:any = await Sucursales.findByPk(ejmp.ID_Sucursal);
        if(!Sucursal){
            return res.status(400).json({ message: 'Ejemplar no disponible en esta sucursal, disponible en sucursal: '+Sucursal.Nombre });
        }
        
        if(Sucursal.ID !== req.body.user.User.ID_Sucursal){
            return res.status(400).json({ message: 'Ejemplar no disponible en esta sucursal, disponible en sucursal: '+Sucursal?.Nombre });
        }

        // Verificar si el usuario ya tiene un préstamo activo del mismo ejemplar
        const prestamoExistente:any = await Prestamos.findOne({
            where: {
                ID_Ejemplar: idEjemplar,
                ID_Usuario: idusuario,
                Estado: 'Pendiente'
            }
        });

        if (prestamoExistente) {
            return res.status(400).json({ 
                message: 'Ya tienes este libro prestado. Debes devolverlo antes de poder prestarlo nuevamente 📚' 
            });
        }

        // Verificar si el ejemplar está reservado
        const reserva = await Reservas.findOne({
            where: {
                ID_Ejemplar: idEjemplar,
                ID_Usuario: idusuario
            }
        });

        // Si había una reserva, eliminarla
        if (reserva) {
            await reserva.destroy();
        }

        // Crear el préstamo
        const fechaPrestamo = new Date();
        const fechaDevolucionPrevista = new Date(fechaPrestamo);
        fechaDevolucionPrevista.setDate(fechaDevolucionPrevista.getDate() + 7);
        
        const nuevoPrestamo = await Prestamos.create({
            ID_Ejemplar: idEjemplar,
            ID_Usuario: idusuario,
            Fecha_prestamo: fechaPrestamo,
            Fecha_devolucion_prevista: fechaDevolucionPrevista,
            Estado: 'Pendiente',
        });


        // Actualizar cantidad de ejemplares
        await ejmp.update({
            Cantidad: ejmp.Cantidad - 1
        });

        res.status(201).json({ message: 'Libro prestado 😊', prestamo: nuevoPrestamo });
    } catch (error) {
        handleHttp(res, 'ERROR_POST_PRESTAMO', error);
    }
}

const putPrestamo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { ID_usuario } = req.body;
        
        const ejj = await Ejemplares.findOne({where:{ID_Libro:id,ID_Sucursal:req.body.user.User.ID_Sucursal}});
        if(!ejj){
            return res.status(404).json({ message: "No se encontró el ejemplar" });
        }
        const prestamo = await Prestamos.findOne({ 
            where: { 
                ID_Ejemplar: ejj?.ID,
                ID_Usuario: ID_usuario,
                Estado: 'Pendiente' 
            } 
        });

        if (!prestamo) {
            return res.status(404).json({ message: "No se encontró el préstamo" });
        }

        const ejemplar = await Ejemplares.findByPk(prestamo.ID_Ejemplar);

        if (!ejemplar) {
            return res.status(400).json({ message: 'No se encontró el ejemplar' });
        }

        // Actualizar el préstamo
        const fechaDevolucion = new Date();
        await prestamo.update({
            Fecha_devolucion_prevista: fechaDevolucion,
            Estado: 'Devuelto'
        });

        // Actualizar cantidad de ejemplares
        await ejemplar.update({
            Cantidad: ejemplar.Cantidad + 1
        });

        res.json({ message: 'Libro devuelto 😊', prestamo });
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATE_PRESTAMO', error);
    }
}


const deletePrestamo = async (req: Request, res: Response) => {
    try {
        const { id,idU } = req.params;
        const prestamo = await Prestamos.findOne({where:{ID_Ejemplar:parseInt(id),ID_Usuario:parseInt(idU)}});
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
