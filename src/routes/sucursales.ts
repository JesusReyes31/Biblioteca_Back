import  { Router,Request, Response } from "express";
import {getSucursal,getSucursales,postSucursal,putSucursal,deleteSucursal} from "../controllers/sucursales.controller";
import { checkAuth, checkRole } from "../middleware/session";
const router = Router();
router.get('/',checkAuth,checkRole(['Admin','Admin Sucursal','Inventario']),getSucursales)
router.get('/:id',checkAuth,checkRole(['Admin','Admin Sucursal']),getSucursal)
router.post('/',checkAuth,checkRole(['Admin']),postSucursal) 
router.put('/:id',checkAuth,checkRole(['Admin']),putSucursal)
router.delete('/:id',checkAuth,checkRole(['Admin']),deleteSucursal)

export {router};