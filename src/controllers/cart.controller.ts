import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Carrito } from "../models/cart.model";
import { Book } from "../models/books.model";
import { Sequelize } from "sequelize";

// Para obtener información específica de 1 artículo en el carrito
const getCart = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { datos } = req.body;
        const Cart = await Carrito.findOne({ where: { ID: id, ID_Usuario: datos.ID_Usuario, ID_Libro: datos.ID_Libro } });
        return Cart ? res.json(Cart) : res.status(404).json({ message: "No se encontró artículo en el carrito" });
    } catch (error) {
        handleHttp(res, 'ERROR_GET_CARRITO', error);
    }
};

// Para obtener todo el carrito del usuario
const getCarts = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // console.log(id)
        const Carts = await Carrito.findAll({ 
            where: { ID_Usuario: parseInt(id)},
            attributes: [
                'ID', 
                'Cantidad',
                'ID_Libro',
                'ID_Usuario',
                [Sequelize.col('Book.Titulo'), 'Titulo'],
                [Sequelize.col('Book.Autor'), 'Autor'],
                [Sequelize.col('Book.Precio'), 'Precio'],
                [Sequelize.col('Book.Imagen'), 'Imagen'],
                [Sequelize.col('Book.Cantidad'), 'Cantidad_disponible']
            ],
            include: [{
                model: Book,
                attributes: ['ID', 'Titulo','Autor', 'Precio', 'Imagen','Cantidad']
            }]
        });
        // console.log(Carts)
        res.status(200).json(Carts);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_CARRITO', error);
    }
};

// Para agregar un artículo al carrito
const addToCart = async (req: Request, res: Response) => {
    try {
        const { ID_Usuario, ID_Libro, Cantidad } = req.body;
        // Verificar si el libro existe en la base de datos
        const libroExistente = await Book.findByPk(ID_Libro);
        if (!libroExistente) {
            return res.status(404).json({ message: "El libro no está registrado" });
        }

        // Buscar si ya existe el item en el carrito
        const itemExistente = await Carrito.findOne({
            where: {
                ID_Usuario: ID_Usuario,
                ID_Libro: ID_Libro
            }
        });

        if (itemExistente) {
            // Si existe, actualizar la cantidad
            itemExistente.Cantidad += Cantidad;
            await itemExistente.save();
            return res.status(200).json(itemExistente);
        }

        // Si no existe, crear nuevo item
        const nuevoItem = await Carrito.create({ 
            ID_Usuario: parseInt(ID_Usuario), 
            ID_Libro: ID_Libro, 
            Cantidad: Cantidad 
        });
        res.status(201).json(nuevoItem);
    } catch (error) {
        handleHttp(res, 'ERROR_POST_CARRITO', error);
    }
};

// Para actualizar un artículo en el carrito
const updateCart = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { cantidad } = req.body;
        const item = await Carrito.findByPk(id);

        if (!item) {
            return res.status(404).json({ message: "Artículo no encontrado en el carrito" });
        }

        item.Cantidad = cantidad;
        await item.save();
        res.json(item);
    } catch (error) {
        handleHttp(res, 'ERROR_PUT_CARRITO', error);
    }
};

// Para eliminar un artículo del carrito
const deleteFromCart = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const items = await Carrito.findAll({ where: { ID_Usuario: parseInt(id) } });

        if (!items) {
            return res.status(404).json({ message: "Artículo no encontrado en el carrito" });
        }
        items.forEach(async (item) => {
            await item.destroy();
        });
        res.json({ message: "Artículo(s) eliminado(s) del carrito" });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_CARRITO', error);
    }
};

export { getCart, getCarts, addToCart, updateCart, deleteFromCart };