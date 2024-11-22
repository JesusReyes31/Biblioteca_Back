import  { Router,Request, Response } from "express";
import { getSale,getSales,getSalesID,postSale,putSale,deleteSale,getVentasPendientes } from "../controllers/sales.controller";
import { checkAuth, checkRole } from "../middleware/session";
const router = Router();

router.get('/pending',checkAuth,checkRole(['Prestamos']),getVentasPendientes)
router.get('/sale/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),getSalesID)
router.get('/',checkAuth,checkRole(['Admin','Admin Sucursal']),getSales) 
router.get('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),getSale)
router.post('/',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),postSale)
router.put('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),putSale)
router.delete('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),deleteSale)

export {router};