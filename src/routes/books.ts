import  { Router,Request, Response } from "express";
import { getBook, getBooks, postBook, putBook, deleteBook, getBooksDisponibles} from "../controllers/books.controller";
import {checkAuth, checkRole} from "../middleware/session";
const router = Router();

router.get('/:idSuc',getBooks)
router.get('/:id/:idSuc',getBook)
router.get('/obtener/disponibles/:id',checkAuth,checkRole(['Prestamos']),getBooksDisponibles)
router.post('/',checkAuth,checkRole(['Inventario']),postBook)
router.put('/:id/:idSuc',checkAuth,checkRole(['Inventario']),putBook)
router.delete('/:id',checkAuth,checkRole(['Inventario']),deleteBook)

export {router};