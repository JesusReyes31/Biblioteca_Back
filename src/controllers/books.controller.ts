import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Book } from "../models/books.model"; 
import { uploadImage } from "../firebase/imageController";
import { Ejemplares } from "../models/ejemplares.model";
import { Op, Sequelize } from "sequelize";
import { Sucursales } from "../models/sucursales.model";
import { sequelize } from "../config/sql";

const getBook = async (req: Request, res: Response) => {
    try {
        const { id,idSuc } = req.params;
        const book = await Ejemplares.findOne({where:{ID_Libro:id,ID_Sucursal:idSuc},
            attributes:['ID','ID_Libro','ID_Sucursal','Cantidad','Precio',
                [Sequelize.col('Book.Titulo'),'Titulo'],
                [Sequelize.col('Book.Autor'),'Autor'],
                [Sequelize.col('Book.Genero'),'Genero'],
                [Sequelize.col('Book.ISBN'),'ISBN'],
                [Sequelize.col('Book.Anio_publicacion'),'Anio_publicacion'],
                [Sequelize.col('Book.Imagen'),'Imagen'],
                [Sequelize.col('Book.Resumen'),'Resumen'],
                [Sequelize.col('Sucursal.Nombre'),'Sucursal']
            ],
            include:[
                {
                    model:Book,
                    attributes:['ID','Titulo','Autor','Genero','ISBN','Anio_publicacion','Imagen','Resumen']
                },
                {
                    model:Sucursales,
                    attributes:['Nombre']
                }
            ],
            order: [
                ['ID_Libro', 'DESC']
            ],
        });
        
        return book ? res.json(book) : res.status(404).json({ message: "No se encontró el libro" });
    } catch (error) {
        handleHttp(res, 'ERROR_GET_BOOK', error);
    }
}

const getBooks = async (req: Request, res: Response) => {
    try {
        const { idSuc } = req.params;
        let books;
        if(!idSuc){
            books = await Ejemplares.findAll({
                attributes:['ID','ID_Libro','ID_Sucursal','Cantidad','Precio',
                    [Sequelize.col('Book.Titulo'),'Titulo'],
                    [Sequelize.col('Book.Autor'),'Autor'],
                    [Sequelize.col('Book.Genero'),'Genero'],
                    [Sequelize.col('Book.ISBN'),'ISBN'],
                    [Sequelize.col('Book.Anio_publicacion'),'Anio_publicacion'],
                    [Sequelize.col('Book.Imagen'),'Imagen'],
                    [Sequelize.col('Book.Resumen'),'Resumen'],
                    [Sequelize.col('Sucursales.Nombre'),'Sucursal']
                ],
                include:[
                    {
                        model:Book,
                        attributes:['ID','Titulo','Autor','Genero','ISBN','Anio_publicacion','Imagen','Resumen']
                    },
                    {
                        model:Sucursales,
                        attributes:['Nombre']
                    }
                ],
                order: [
                    ['ID_Libro', 'DESC']
                ],
                raw:true
            });
        }else{
            books = await Ejemplares.findAll({
                where:{ID_Sucursal:parseInt(idSuc)},
                attributes:['ID','ID_Libro','ID_Sucursal','Cantidad','Precio',
                    [Sequelize.col('Book.Titulo'),'Titulo'],
                    [Sequelize.col('Book.Autor'),'Autor'],
                    [Sequelize.col('Book.Genero'),'Genero'],
                    [Sequelize.col('Book.ISBN'),'ISBN'],
                    [Sequelize.col('Book.Anio_publicacion'),'Anio_publicacion'],
                    [Sequelize.col('Book.Imagen'),'Imagen'],
                    [Sequelize.col('Book.Resumen'),'Resumen'],
                    [Sequelize.col('Sucursales.Nombre'),'Sucursal']
                ],
                include:[
                    {
                        model:Book,
                        attributes:[]
                    },
                    {
                        model:Sucursales,
                        as:'Sucursales',
                        attributes:[]
                    }
                ],
                order: [
                    ['ID_Libro', 'DESC']
                ],
                raw:true
            });
        }
        res.status(200).json(books);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_BOOKS', error);
    }
}

const getBooksDisponibles = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const books = await Ejemplares.findAll({
            where: { ID_Libro: id,ID_Sucursal:req.body.user.User.ID_Sucursal, Cantidad: { [Op.gt]: 0 }, },
            attributes:['ID','ID_Libro','ID_Sucursal','Cantidad','Precio',
                [Sequelize.col('Sucursales.Nombre'),'Sucursal'],
                [Sequelize.col('Book.Titulo'),'Titulo'],
                [Sequelize.col('Book.Autor'),'Autor'],
            ],
            include:[
                {
                    model:Sucursales,
                    as:'Sucursales',
                    attributes:[]
                },
                {
                    model:Book,
                    attributes:[]
                }
            ],
            order: [
                ['ID_Libro', 'DESC']
            ],
        }); 
        res.status(200).json(books);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_BOOKS_DISPONIBLES', error);
    }
}

const postBook = async (req: Request, res: Response) => {
    try {
        const uploadResult = await uploadImage(req, res);
        if (!uploadResult.success || !uploadResult.url) {
            return res.status(400).json({ 
                message: !uploadResult.success ? uploadResult.message : 'No se pudo obtener la URL de la imagen' 
            });
        }

        // Verificar si el libro ya existe
        const libroExistente = await Book.findOne({
            where: { 
                ISBN: req.body.ISBN // Asumiendo que el ISBN es único
            }
        });

        let bookID;
        if (libroExistente) {
            // Si el libro existe, usar su ID
            bookID = libroExistente.ID;
        } else {
            // Si no existe, generar nuevo ID
            const ultimoLibro = await Book.findOne({
                attributes: ['ID'],
                order: [
                    [Sequelize.literal('CAST(SUBSTRING(ID, 2, LEN(ID)) AS INT)'), 'DESC']
                ],
                raw: true
            });

            bookID = 'L1';
            if (ultimoLibro) {
                const ultimoNumero = parseInt(ultimoLibro.ID.substring(1));
                bookID = `L${ultimoNumero + 1}`;
            }
        }

        // Datos del ejemplar
        const ejemplarData = {
            ID_Libro: bookID,
            ID_Sucursal: parseInt(req.body.user.User.ID_Sucursal),
            Cantidad: parseInt(req.body.Cantidad),
            Precio: parseFloat(req.body.Precio)
        };

        try {
            const result = await sequelize.transaction(async (t) => {
                let book;
                
                if (!libroExistente) {
                    // Si el libro no existe, crearlo
                    const bookData = {
                        ID: bookID,
                        Titulo: req.body.Titulo,
                        Autor: req.body.Autor,
                        Genero: req.body.Genero,
                        ISBN: req.body.ISBN,
                        Anio_publicacion: req.body.Anio_publicacion,
                        Resumen: req.body.Resumen,
                        Imagen: uploadResult.url
                    };
                    book = await Book.create(bookData, { transaction: t });
                } else {
                    book = libroExistente;
                }

                // Verificar si ya existe un ejemplar para esta sucursal
                const ejemplarExistente = await Ejemplares.findOne({
                    where: {
                        ID_Libro: bookID,
                        ID_Sucursal: ejemplarData.ID_Sucursal
                    },
                    transaction: t
                });

                let ejemplar;
                if (ejemplarExistente) {
                    // Si existe, actualizar cantidad
                    ejemplarExistente.Cantidad += ejemplarData.Cantidad;
                    ejemplar = await ejemplarExistente.save({ transaction: t });
                } else {
                    // Si no existe, crear nuevo
                    ejemplar = await Ejemplares.create(ejemplarData, { transaction: t });
                }

                return { 
                    book, 
                    ejemplar,
                    message: libroExistente ? 
                        "Libro existente, se actualizó el inventario" : 
                        "Nuevo libro creado con éxito"
                };
            });

            res.status(201).json(result);
        } catch (error) {
            throw error;
        }

    } catch (error) {
        console.error('Error al crear el libro y ejemplar:', error);
        return res.status(500).json({ message: 'Error al crear el libro y ejemplar', error});
    }
};

const putBook = async (req: Request, res: Response) => {
    try {
        const { id, idSuc } = req.params;
        let uploadResult;
        if(req.body.Imagen.includes('https://storage.googleapis.com/')){
            uploadResult = {success:true,url:req.body.Imagen}
        }else{
            uploadResult = await uploadImage(req, res);
        }
        if (!uploadResult.success || !uploadResult.url) {
            return res.status(400).json({ 
                message: !uploadResult.success ? uploadResult.message : 'No se pudo obtener la URL de la imagen' 
            });
        }

        const bookData = {
            ID:id,
            Titulo:req.body.Titulo,
            Autor:req.body.Autor,
            Genero:req.body.Genero,
            ISBN:req.body.ISBN,
            Anio_publicacion:req.body.Anio_publicacion,
            Resumen:req.body.Resumen,
            Imagen: uploadResult.url
        };
        const ejemplarData = {
            Cantidad: parseInt(req.body.Cantidad),
            Precio: parseFloat(req.body.Precio)
        };
        const result = await sequelize.transaction(async (t) => {
            const book = await Book.findByPk(id, { transaction: t });
            const ejemplar = await Ejemplares.findOne({
                where: { 
                    ID_Libro: id,
                    ID_Sucursal: idSuc
                },
                transaction: t
            });

            if (!book || !ejemplar) {
                throw new Error("No se encontró el libro o ejemplar");
            }

            await book.update(bookData, { transaction: t });
            await ejemplar.update(ejemplarData, { transaction: t });
            
            return { book, ejemplar };
        });

        res.json(result);
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATE_BOOK', error);
    }
};

const deleteBook = async (req: Request, res: Response) => {
    try {
        const { id} = req.params;
        const idSuc = req.body.user.User.ID_Sucursal;
        console.log('ID del libro: ' + id);
        console.log('Tipo de ID del libro: ' + typeof id);
        console.log('ID de la sucursal: ' + idSuc);
        console.log('Tipo de ID de la sucursal: ' + typeof idSuc);

        await sequelize.transaction(async (t) => {
            // Primero eliminamos los ejemplares
            await Ejemplares.destroy({
                where: { 
                    ID_Libro: id,
                    ID_Sucursal: idSuc
                },
                transaction: t
            });

            // Luego verificamos si quedan ejemplares del libro
            const remainingEjemplares = await Ejemplares.count({
                where: { ID_Libro: id },
                transaction: t
            });

            // Si no quedan ejemplares, eliminamos el libro
            if (remainingEjemplares === 0) {
                await Book.destroy({
                    where: { ID: id },
                    transaction: t
                });
            }
        });

        res.json({ message: "Libro y ejemplares eliminados correctamente" });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_BOOK', error);
    }
};

// const obtenerURL = async (req:Request,res:Response) => {
//     const {Imagen} = req.body
//     const url = decrypt(Imagen);
//     res.status(201).json({URL:url});
// }


export { getBook, getBooks, getBooksDisponibles, postBook, putBook, deleteBook/*, obtenerURL */};
