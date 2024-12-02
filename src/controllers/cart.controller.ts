import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Carrito } from "../models/cart.model";
import { Book } from "../models/books.model";
import { Sequelize } from "sequelize";
import { Ejemplares } from "../models/ejemplares.model";
import { Sucursales } from "../models/sucursales.model";

// Para obtener información específica de 1 artículo en el carrito
const getCart = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { datos } = req.body;
        const Cart = await Carrito.findOne({ 
            where: { 
                ID: id, 
                ID_Usuario: datos.ID_Usuario, 
                ID_Ejemplar: datos.ID_Ejemplar 
            },
            attributes: [
                'ID', 
                'Cantidad',
                'ID_Ejemplar',
                'ID_Usuario',
                [Sequelize.col('Ejemplares.ID_Libro'), 'ID_Libro'],
                [Sequelize.col('Ejemplares.Book.Titulo'), 'Titulo'],
                [Sequelize.col('Ejemplares.Book.Autor'), 'Autor'],
                [Sequelize.col('Ejemplares.Precio'), 'Precio'],
                [Sequelize.col('Ejemplares.Book.Imagen'), 'Imagen'],
                [Sequelize.col('Ejemplares.Cantidad'), 'Cantidad_disponible'],
                [Sequelize.col('Ejemplares.Sucursal.Nombre'), 'Sucursal']
            ],
            include: [{
                model: Ejemplares,
                attributes: [],
                include: [{
                    model: Book,
                    attributes: []
                },
                {
                    model: Sucursales,
                    attributes: []
                }]
            }]
        });
        return Cart ? res.json(Cart) : res.status(404).json({ message: "No se encontró artículo en el carrito" });
    } catch (error) {
        handleHttp(res, 'ERROR_GET_CARRITO', error);
    }
};

// Para obtener todo el carrito del usuario
const getCarts = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const Carts = await Carrito.findAll({ 
            where: { ID_Usuario: parseInt(id)},
            attributes: [
                'ID', 
                'Cantidad',
                'ID_Ejemplar',
                'ID_Usuario',
                [Sequelize.col('Ejemplar.ID_Libro'), 'ID_Libro'],
                [Sequelize.col('Ejemplar.Book.Titulo'), 'Titulo'],
                [Sequelize.col('Ejemplar.Book.Autor'), 'Autor'],
                [Sequelize.col('Ejemplar.Precio'), 'Precio'],
                [Sequelize.col('Ejemplar.Book.Imagen'), 'Imagen'],
                [Sequelize.col('Ejemplar.Cantidad'), 'Cantidad_disponible'],
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
            }]
        });
        res.status(200).json(Carts);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_CARRITO', error);
    }
};

// Para agregar un artículo al carrito
const addToCart = async (req: Request, res: Response) => {
    try {
        const { ID_Usuario, ID_Ejemplar, Cantidad } = req.body;
        
        // Verificar si el ejemplar existe
        const ejemplar = await Ejemplares.findByPk(ID_Ejemplar);

        if (!ejemplar) {
            return res.status(404).json({ 
                message: "El ejemplar no está disponible" 
            });
        }

        if (ejemplar.Cantidad < Cantidad) {
            return res.status(400).json({ 
                message: "No hay suficientes ejemplares disponibles" 
            });
        }

        // Buscar si ya existe el item en el carrito
        const itemExistente = await Carrito.findOne({
            where: {
                ID_Usuario: ID_Usuario,
                ID_Ejemplar: ID_Ejemplar
            }
        });

        if (itemExistente) {
            // Verificar que la nueva cantidad total no exceda el stock
            const nuevaCantidadTotal = itemExistente.Cantidad + Cantidad;
            if (nuevaCantidadTotal > ejemplar.Cantidad) {
                return res.status(400).json({ 
                    message: "La cantidad solicitada excede el stock disponible" 
                });
            }

            // Si existe, actualizar la cantidad
            itemExistente.Cantidad = nuevaCantidadTotal;
            await itemExistente.save();
            return res.status(200).json(itemExistente);
        }

        // Si no existe, crear nuevo item
        const nuevoItem = await Carrito.create({ 
            ID_Usuario: parseInt(ID_Usuario), 
            ID_Ejemplar: ID_Ejemplar,
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
        const item = await Carrito.findOne({ 
            where: { 
                ID: parseInt(id)
            } 
        });

        if (!item) {
            return res.status(404).json({ message: "Artículo no encontrado en el carrito" });
        }
        await item.destroy();
        res.json({ message: "Artículo eliminado del carrito" });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_CARRITO', error);
    }
};

//Eliminar todos los artículos del carrito de un usuario
const deleteAllCart = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log(id)
        const items = await Carrito.findAll({ where: { ID_Usuario: parseInt(id) } });
        items.forEach(async (item) => {
            await item.destroy();
        });
        res.json({ message: "Artículo(s) eliminado(s) del carrito" });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_ALL_CARRITO', error);
    }
};

export { getCart, getCarts, addToCart, updateCart, deleteFromCart, deleteAllCart };