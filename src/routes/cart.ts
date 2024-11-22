import  { Router,Request, Response } from "express";
import {checkAuth, checkRole} from "../middleware/session";
import { addToCart, deleteFromCart, getCart, getCarts, updateCart } from "../controllers/cart.controller";

const router = Router();
router.get('/',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),getCarts)
router.get('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),getCart)
router.post('/',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),addToCart)
router.put('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),updateCart)
router.delete('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),deleteFromCart)

export {router};