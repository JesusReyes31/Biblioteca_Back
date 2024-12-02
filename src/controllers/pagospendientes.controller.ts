import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Pago_Pendiente } from "../models/pagos_pendientes.model";

//Obtener todos los pagos pendientes
const getPagosPendientes = async (req: Request, res: Response) => {
    try {
        const pagosPendientes = await Pago_Pendiente.findAll();
        res.status(200).json(pagosPendientes);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_PAGOS_PENDIENTES', error);
    }
}

//Obtener un pago pendiente por su ID de venta
const getPagoPendienteByIDVenta = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const pagoPendiente = await Pago_Pendiente.findAll({ where: { ID_Venta: parseInt(id) } });
        res.status(200).json(pagoPendiente);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_PAGO_PENDIENTE_BY_ID_VENTA', error);
    }
}

//Crear un pago pendiente   
const createPagoPendiente = async (req: Request, res: Response) => {
    try {
        const PagoPendiente = req.body;
        const pagoPendiente = await Pago_Pendiente.create(PagoPendiente);
        res.status(200).json(pagoPendiente);
    } catch (error) {
        handleHttp(res, 'ERROR_CREATE_PAGO_PENDIENTE', error);
    }
}

//Actualizar un pago pendiente
const updatePagoPendiente = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await Pago_Pendiente.update(req.body, { where: { ID: parseInt(id) } });
        res.status(200).json({ message: 'Pago pendiente actualizado correctamente' });
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATE_PAGO_PENDIENTE', error);
    }
}

//Eliminar un pago pendiente    
const deletePagoPendiente = async (req: Request, res: Response) => {
    try {
        const { id, codigo } = req.params;
        await Pago_Pendiente.destroy({ where: { ID_Venta: parseInt(id), Codigo: codigo } });
        res.status(200).json({ message: 'Pago pendiente eliminado correctamente' });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_PAGO_PENDIENTE', error);
    }
}

export { getPagosPendientes, getPagoPendienteByIDVenta, createPagoPendiente, updatePagoPendiente, deletePagoPendiente };
