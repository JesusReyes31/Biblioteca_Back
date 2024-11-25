import  { Router,Request, Response } from "express";
import {checkAuth} from "../middleware/session";
import { getMetodosPago, postMetodosPago, updateMetodosPago, deleteMetodosPago } from "../controllers/pagos.controller";

const router = Router();
router.get('/:id',checkAuth,getMetodosPago);
router.post('/',checkAuth,postMetodosPago);
router.put('/',checkAuth,updateMetodosPago);
router.delete('/:id',checkAuth,deleteMetodosPago);

export {router};