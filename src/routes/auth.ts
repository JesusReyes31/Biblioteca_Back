import  { Router,Request, Response } from "express";
import { registerCtrl,loginCtrl, verifyTokenCtrl, activateAccountCtrl } from "../controllers/auth";
import { checkAuth, checkRole } from "../middleware/session";
const router = Router();

router.post('/login',loginCtrl)
router.post('/register',checkAuth,checkRole(['Admin','Admin Sucursal','Prestamos']),registerCtrl)
router.get('/verify-token', verifyTokenCtrl);
router.get('/activate/:token', activateAccountCtrl);

export {router}