import  { Router,Request, Response } from "express";
import { getDetail,getDetails,postDetail,putDetail,deleteDetail } from "../controllers/detailsales.controller";
import { checkAuth, checkRole } from "../middleware/session";
const router = Router();

router.get('/',checkAuth,checkRole(['Admin Sucursal','Admin']),getDetails) //Porque solo los Admins son los que podrán ver, para reportes
router.get('/:id',checkAuth,getDetail) //Ya que el usuario autenticado puede checar los reportes de venta propios
router.post('/:id',checkAuth,postDetail)

//Verificar en qué puntos se tomarían estos 2 endpoints
router.put('/:id',putDetail)
router.delete('/:id',deleteDetail)

export {router};