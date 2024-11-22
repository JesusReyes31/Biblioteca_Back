import  { Router,Request, Response } from "express";
import { getReserva, getReservas, postReserva, putReserva, deleteReserva, getReservasByID  } from "../controllers/reservas.controller";
import { checkAuth, checkRole } from "../middleware/session";
const router = Router();

router.get('/ByID/:id',checkAuth,checkRole(['Admin Sucursal','Prestamos','Inventario','Cliente']),getReservasByID)
router.get('/',checkAuth,checkRole(['Admin Sucursal','Prestamos']),getReservas)
router.get('/:id',checkAuth,checkRole(['Admin Sucursal','Prestamos','Inventario','Cliente']),getReserva)
router.post('/',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),postReserva)
// router.post('/',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),postReserva)
router.put('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),putReserva)
router.delete('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),deleteReserva)

export {router};