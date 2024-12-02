import { Router } from "express";
import { generarRecibo, generarInformePrestamos, generarReporte } from "../controllers/doctos.controller";
import { checkAuth, checkRole } from "../middleware/session";

const router = Router();

router.get("/recibo/:id", checkAuth, generarRecibo);
router.get("/prestamos", checkAuth, checkRole(['Admin Sucursal']), generarInformePrestamos);
router.post("/reporte", checkAuth, checkRole(['Admin Sucursal']), generarReporte);
export { router };