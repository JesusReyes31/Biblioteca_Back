import  { Router,Request, Response } from "express";
import {checkAuth, checkRole} from "../middleware/session";
import { getPagosPendientes, getPagoPendienteByIDVenta, createPagoPendiente, updatePagoPendiente, deletePagoPendiente } from "../controllers/pagospendientes.controller";

const router = Router();

router.get('/',checkAuth,checkRole(['Admin','Admin Sucursal']),getPagosPendientes);
router.get('/:id',checkAuth,getPagoPendienteByIDVenta);
router.post('/',checkAuth,checkRole(['Prestamos','Inventario','Cliente']),createPagoPendiente);
// router.put('/:id',checkAuth,checkRole(['Prestamos','Inventario']),updatePagoPendiente);
router.delete('/:id/:codigo',checkAuth,checkRole(['Admin Sucursal','Prestamos']),deletePagoPendiente);

export {router};    