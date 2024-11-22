import  { Router,Request, Response } from "express";
import { getResena, getResenas, postResena, putResena, deleteResena } from "../controllers/resenas.controller";
import { checkAuth, checkRole } from "../middleware/session";
const router = Router();

router.get('/all/:id',getResenas)
router.get('/usuario/:idUsuario/:idLibro',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),getResena)
router.post('/',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),postResena)
router.put('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),putResena)
router.delete('/:id',checkAuth,checkRole(['Inventario','Prestamos','Cliente']),deleteResena)

export {router};