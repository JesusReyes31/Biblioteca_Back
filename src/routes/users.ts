import { Router } from "express";
import { getUsers, getUser, putUser, deleteUserr, getTypeUsers, putUserImage } from "../controllers/users.controller";
import { checkAuth, checkRole } from "../middleware/session";

const router = Router();

router.get("/tipo",checkAuth,checkRole(['Admin','Admin Sucursal','Prestamos']), getTypeUsers);
router.get("/",checkAuth,checkRole(['Admin','Admin Sucursal','Prestamos']), getUsers);
router.get("/:id",checkAuth,getUser);
router.put("/image/:id",checkAuth,putUserImage); 
router.put("/:id",checkAuth,putUser); 
router.delete("/:id",checkAuth, deleteUserr);

export { router };
