import  { Router,Request, Response } from "express";
import {checkAuth, checkRole} from "../middleware/session";
import { getGenres,getBooksByGenre, search, nodemail, resetpassword, prinAdminSuc, prinAdmin, credencial, reportes, verify_token, prinGen } from "../controllers/others.controller";
const router = Router();

router.get('/booksgenre/:genre',getBooksByGenre)
router.get('/genres',getGenres);
router.get('/reportes/:reporte',checkAuth,checkRole(['Admin','Admin Sucursal']),reportes)
router.get('/prinadminsuc',checkAuth,checkRole(['Admin Sucursal']),prinAdminSuc)
router.get('/prinadmin',checkAuth,checkRole(['Admin']),prinAdmin)
router.get('/pringen',prinGen)
router.get('/verify-token',verify_token);
router.post('/cred/:id',checkAuth,credencial)
router.post('/mail',nodemail)
router.post('/search',search)
router.put('/reset-pass',resetpassword)
export {router};