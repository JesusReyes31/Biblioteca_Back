import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Book } from "../models/books.model"; 
import { uploadImage } from "../firebase/imageController";

const getBook = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const book = await Book.findByPk(id);
        
        return book ? res.json(book) : res.status(404).json({ message: "No se encontró el libro" });
    } catch (error) {
        handleHttp(res, 'ERROR_GET_BOOK', error);
    }
}

const getBooks = async (req: Request, res: Response) => {
    try {
        const books = await Book.findAll();
        res.status(200).json(books);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_BOOKS', error);
    }
}

const postBook = async (req: Request, res: Response) => {
    console.log("Cuerpo de la solicitud:", req.body);
    try {
        const uploadResult = await uploadImage(req, res); // Llama a la función uploadImag
        // console.log("Resultado de la subida:", uploadResult);
        // Verifica si la carga fue exitosa
        if (!uploadResult.success) {
            return res.status(400).json(uploadResult.message); // Muestra el mensaje de error
        }
        // Verifica que la URL de la imagen esté presente
        if (!uploadResult.url) {
            return res.status(400).json({ message: 'No se pudo obtener la URL de la imagen' });
        }

        req.body.Imagen = uploadResult.url; // Usa la URL encriptada
        // console.log("Datos del libro antes de crear:", req.body);
        req.body.Disponibilidad = 'Disponible';
        req.body.ID_Sucursal =  parseInt(req.body.ID_Sucursal);
        const bookData = req.body;
        const url = req.body.Imagen;
        // Crear el nuevo libro en la base de datos
        const newBook = await Book.create(bookData);
        // console.log("Libro creado:", newBook);
        res.status(201).json({Book:newBook,URL:url});
    } catch (error) {
        console.error('Error al crear el libro:', error);
        return res.status(500).json({ message: 'Error al crear el libro', error});
    }
};



const putBook = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const uploadResult = await uploadImage(req, res);
        const bookData = req.body;
        if (!uploadResult.success) {
            return res.status(400).json(uploadResult.message); // Muestra el mensaje de error
        }
        // Verifica que la URL de la imagen esté presente
        if (!uploadResult.url) {
            return res.status(400).json({ message: 'No se pudo obtener la URL de la imagen' });
        }
        req.body.Imagen = uploadResult.url; // Usa la URL encriptada
        // console.log("Datos del libro antes de crear:", req.body);
        req.body.ID_Sucursal =  parseInt(req.body.ID_Sucursal);
        const book = await Book.findByPk(id);
        if (!book) {
            return res.status(404).json({ message: "No se encontró el libro" });
        }
        await book.update(bookData);
        res.json(book);
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATE_BOOK', error);
    }
}

const deleteBook = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const book = await Book.findByPk(id);
        if (!book) {
            return res.status(404).json({ message: "No se encontró el libro" });
        }
        await book.destroy();
        res.json({ message: "Libro eliminado correctamente" });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_BOOK', error);
    }
}

// const obtenerURL = async (req:Request,res:Response) => {
//     const {Imagen} = req.body
//     console.log(Imagen)
//     const url = decrypt(Imagen);
//     res.status(201).json({URL:url});
// }


export { getBook, getBooks, postBook, putBook, deleteBook/*, obtenerURL */};
