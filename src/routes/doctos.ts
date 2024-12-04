import { Router } from "express";
import { generarRecibo, generarInformePrestamos, generarReporte, generarFactura, enviarFactura } from "../controllers/doctos.controller";
import { checkAuth, checkRole } from "../middleware/session";

const router = Router();

router.get("/recibo/:id", checkAuth, generarRecibo);
router.get("/prestamos", checkAuth, checkRole(['Admin Sucursal']), generarInformePrestamos);
router.get("/factura/:id",checkAuth,checkRole(['Prestamos','Inventario','Cliente']), generarFactura);
router.post("/reporte",checkAuth,checkRole(['Admin','Admin Sucursal']),generarReporte);
router.post("/enviar-factura", checkAuth, checkRole(['Prestamos','Inventario','Cliente']),enviarFactura);
export { router };