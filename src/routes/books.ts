import  { Router,Request, Response } from "express";
import { getBook, getBooks, postBook, putBook, deleteBook} from "../controllers/books.controller";
import {checkAuth, checkRole} from "../middleware/session";
const router = Router();

router.get('/',getBooks)
router.get('/:id',getBook)
router.post('/',checkAuth,checkRole(['Inventario']),postBook)
router.put('/:id',checkAuth,checkRole(['Inventario']),putBook)
router.delete('/:id',checkAuth,checkRole(['Inventario']),deleteBook)

export {router};