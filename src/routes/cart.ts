import  { Router,Request, Response } from "express";
import {checkAuth, checkRole} from "../middleware/session";
import { addToCart, deleteAllCart, deleteFromCart, getCart, getCarts, updateCart } from "../controllers/cart.controller";

const router = Router();
router.get('/articulo/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),getCart) // Obtener un artículo específico del carrito
router.get('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),getCarts) // Obtener todos los artículos del carrito
router.post('/',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),addToCart) // Agregar un artículo al carrito
router.put('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),updateCart) // Actualizar la cantidad de un artículo en el carrito
router.delete('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),deleteFromCart) // Eliminar un artículo del carrito  
router.delete('/all/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),deleteAllCart) // Eliminar todos los artículos del carrito

export {router};