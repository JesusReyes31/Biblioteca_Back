import { Request, Response } from "express"
import { handleHttp } from "../utils/error.handle";
import { Venta } from "../models/sales.model";
import { user } from "../models/users.model";
import { Sequelize } from "sequelize";
import { Pago_Pendiente } from "../models/pagos_pendientes.model";
// Obtener Ventas pendientes de entrega
const getVentasPendientes = async (req: Request, res: Response) => {
    try {
        const ventasPendientes = await Venta.findAll({
            where: {
                Entregado: "No"
            },
            attributes: [
                'ID_Venta',
                'ID_Usuario',
                'Cantidad',
                [Sequelize.col('user.Nombre_Usuario'), 'Nombre_Usuario'],
                [
                    Sequelize.literal("CONVERT(VARCHAR(10), Venta.Fecha_Venta, 120)"),
                    'Fecha_Venta'
                ],
                'Total',
                'Entregado',
                [
                    Sequelize.literal(`(
                        SELECT CASE 
                            WHEN EXISTS (
                                SELECT 1 
                                FROM Pagos_Pendientes 
                                WHERE Pagos_Pendientes.ID_Venta = Venta.ID_Venta
                            ) 
                            THEN 'SI' 
                            ELSE 'NO' 
                        END
                    )`),
                    'Pendiente'
                ]
            ],
            include: [
                {
                    model: user,
                    attributes: []
                }
            ],
            order: [
                ['Fecha_Venta', 'ASC']
            ],
            raw: true
        });

        if (!ventasPendientes.length) {
            return res.status(200).json({
                message: "No hay ventas pendientes de entrega",
                data: []
            });
        }

        return res.status(200).json({
            message: "Ventas pendientes de entrega encontradas",
            data: ventasPendientes
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message: "Error al obtener las ventas pendientes",
            error: error
        });
    }
};

// Obtener Ventas por ID de Venta
const getSale = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const idSale = await Venta.findByPk(parseInt(id),
        {
            attributes: ['ID_Venta','ID_Usuario','Cantidad','Total','Fecha_Venta','Entregado',[Sequelize.col('user.Nombre_Usuario'),'Nombre_Usuario']],
            include: [{
                model: user,
                attributes: []
            }],
            raw: true
        });
        return idSale ? res.json(idSale) : res.status(404).json({ message: "No existe esa Venta"});
    } catch (error) {
        handleHttp(res, 'ERROR_GET_SALE');
    }
}

// Obtener Ventas 
const getSales = async (req: Request, res: Response) => {
    try{
        const Sale = await Venta.findAll();
        res.status(200).json(Sale);
    } catch(error){
        handleHttp(res, 'ERROR_GET_SALES');
    }
}

// Obtener Ventas por ID de Usuario
const getSalesID = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const SaleID = await Venta.findAll({
            where: { ID_Usuario: parseInt(id) } // Aquí haces la búsqueda por el ID del usuario
        });
        console.log(SaleID)
        if (SaleID.length > 0) {
            res.status(200).json(SaleID); // Enviar las ventas encontradas
        } else {
            res.status(404).json({ message: "oNo se encontraron ventas para este usuario" });
        }
    } catch(error){
        handleHttp(res, 'ERROR_GET_SALESID');
    }
}



const postSale = async( req: Request, res:Response) => {
    try{
        const Sale = req.body;
        Sale.Fecha_Venta=new Date();
        const newSale = await Venta.create(Sale);
        res.status(201).json(newSale);
    } catch{
        handleHttp(res, 'ERROR_POSTING_SALE')
    }
}

const putSale = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const Sale = req.body;
        const idSale = await Venta.findByPk(id);
        if(!idSale){
            return res.status(404).json({ message: "No existe esa Venta"})
        } 
        await idSale.update(Sale);
        res.json(idSale);

    }catch(error){
        handleHttp(res, 'ERROR_UPDATING_SALE');
    }
}

const deleteSale = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const idSale = await Venta.findByPk(id);
        if(!idSale){
            return res.status(404).json({ message: "No existe ese usuario"})
        }
        await idSale.destroy()
        res.json({ message:"Usuario borrado de la base de datos"});

    }catch{
        handleHttp(res, 'ERROR_DELETING_SALE')
    }
}


export { getVentasPendientes, getSale, getSales, getSalesID, postSale, putSale, deleteSale };
