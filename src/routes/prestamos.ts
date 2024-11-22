import  { Router,Request, Response } from "express";
import { getPrestamo, getPrestamos, postPrestamo, putPrestamo, deletePrestamo, getPrestamoSearch, getPrestamosDevueltos } from "../controllers/prestamos.controller";
import { checkAuth, checkRole } from "../middleware/session";
const router = Router();


router.get('/devueltos/:idUsuario/:idLibro',checkAuth,checkRole(['Prestamos','Inventario','Cliente']),getPrestamosDevueltos)
// router.get('/search',checkAuth,checkRole(['Prestamos','Inventario','Cliente']),getPrestamoSearch)
router.get('/:id',checkAuth,checkRole(['Prestamos','Inventario','Cliente']),getPrestamo)
router.get('/',checkAuth,checkRole(['Admin Sucursal']),getPrestamos)
router.post('/',checkAuth,checkRole(['Prestamos']),postPrestamo) //Porque solo personal Prestamos va a poder guardar prestamos
router.put('/:id',checkAuth,checkRole(['Prestamos']),putPrestamo)//Para Devolver los libros
//Checar en que casos se utilizarían
router.delete('/:id/:idU',deletePrestamo)

export {router};