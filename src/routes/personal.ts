import  { Router,Request, Response } from "express";
import {checkAuth, checkRole} from "../middleware/session";
import { getSucursalForUser } from "../controllers/personal.controller";

const router = Router();
router.get('/:id',checkAuth,checkRole(['Admin Sucursal','Inventario','Prestamos']),getSucursalForUser);

export {router};