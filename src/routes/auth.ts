import  { Router,Request, Response } from "express";
import { registerCtrl,loginCtrl, verifyTokenCtrl } from "../controllers/auth";
import { checkAuth, checkRole } from "../middleware/session";
const router = Router();

router.post('/login',loginCtrl)
router.post('/register',checkAuth,checkRole(['Admin','Admin Sucursal','Prestamos']),registerCtrl)
router.get('/verify-token', verifyTokenCtrl);

export {router}