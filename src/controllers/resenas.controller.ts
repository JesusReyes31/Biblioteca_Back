import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Resenas } from "../models/Resenas.model"; 
import { Prestamos } from "../models/Prestamos.model";
import { user } from "../models/users.model";
import { Sequelize } from "sequelize";
import { Ejemplares } from "../models/ejemplares.model";

//Reseña de un Usuario
const getResena = async (req: Request, res: Response) => {
    try {
        const { idUsuario, idLibro } = req.params;
        const resena = await Resenas.findOne({where:{ID_Usuario:idUsuario,ID_Libro:idLibro}});
        res.status(200).json(resena);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_RESEÑA', error);
    }
}

const getResenas = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const ejemplar = await Ejemplares.findOne({where:{ID:parseInt(id)}})
        const resenasData = await Resenas.findAll({
            where: { ID_Libro: ejemplar?.ID_Libro },
            attributes: [
                'ID_Usuario',
                'ID_Resena',
                'ID_Libro', 
                'Calificacion',
                [
                    Sequelize.literal("CONVERT(VARCHAR(10), Resenas.Fecha, 120)"),
                    'Fecha'
                ],
                'Descripcion',
                [Sequelize.col('user.Nombre_Usuario'), 'Nombre_Usuario']
            ], // Ajusta los atributos de Resenas que necesitas
            include: [
                {
                    model: user,
                    attributes: []  // Asumiendo que el campo del nombre es 'nombre', cámbialo si es diferente
                }
            ],
            order: [
                ['ID_Resena', 'DESC'] // Agregamos el orden descendente
            ],
            raw: true
        });
        const resenas = resenasData
        // console.log(resenas); // Aquí verás la información completa de la reseña y el nombre del usuario
        res.status(200).json(resenas);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_RESEÑAS', error);
    }
};


const postResena = async (req: Request, res: Response) => {
    try {
        const resenaData = req.body;
        // console.log(resenaData);
        // Si pasa las verificaciones, se puede crear la reseña
        const newResena = await Resenas.create({
            ID_Libro: resenaData.ID_Libro, 
            ID_Usuario: resenaData.ID_Usuario,
            Calificacion: resenaData.Calificacion,
            Fecha: new Date(),
            Descripcion: resenaData.Descripcion
        });
        res.status(201).json(newResena);

    } catch (error) {
        handleHttp(res, 'ERROR_POST_RESEÑA', error);
    }
}

const putResena = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { Calificacion, Descripcion } = req.body;

        // Verificar que la reseña existe
        const resena = await Resenas.findByPk(id);
        if (!resena) {
            return res.status(404).json({ message: "No se encontró la reseña" });
        }
        // Actualizar la reseña
        resena.Calificacion = Calificacion;
        resena.Descripcion = Descripcion ;
        // console.log(resena);
        await resena.save();
        res.json(resena);
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATE_RESEÑA', error);
    }
}


const deleteResena = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Verificar que la reseña existe
        const resena = await Resenas.findByPk(id);
        if (!resena) {
            return res.status(404).json({ message: "No se encontró la reseña" });
        }
        // Eliminar la reseña
        await resena.destroy();
        res.json({ message: "Reseña eliminada correctamente" });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_RESEÑA', error);
    }
}


export { getResena, getResenas, postResena, putResena, deleteResena };
