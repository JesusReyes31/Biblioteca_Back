import  { Router,Request, Response } from "express";
import {checkAuth, checkRole} from "../middleware/session";
import { generarRecibo } from "../controllers/doctos.controller";

const router = Router();

router.get("/recibo/:id",checkAuth,generarRecibo);

export {router};