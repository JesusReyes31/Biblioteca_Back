import { Request, Response } from "express"
import { handleHttp } from "../utils/error.handle";
import { Detail } from "../models/detailsales.model";

const getDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const idSale = await Detail.findByPk(id);
        return idSale ? res.json(idSale) : res.status(404).json({ message: "No existe ese Detalle de Venta"});
    } catch (error) {
        handleHttp(res, 'ERROR_GET_DETAILSALE');
    }
}

const getDetails = async (req: Request, res: Response) => {
    try{
        const detail = await Detail.findAll();
        res.status(200).json(detail);
    } catch(error){
        handleHttp(res, 'ERROR_GET_DETAILSALES');
    }
}

const postDetail = async( req: Request, res:Response) => {

    try{
        const Detail = req.body;
        const newDetail = await Detail.create(Detail);
        res.status(201).json(newDetail);
    } catch{
        handleHttp(res, 'ERROR_POSTING_DETAILSALE')
    }
}

const putDetail = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const Detail = req.body;
        const idDetail = await Detail.findByPk(id);
        if(!idDetail){
            return res.status(404).json({ message: "No existe ese Detalle de Venta"})
        } 
        await idDetail.update(Detail);
        res.json(idDetail);

    }catch(error){
        handleHttp(res, 'ERROR_UPDATING_DETAILSALE');
    }
}

const deleteDetail = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const idDetail = await Detail.findByPk(id);
        if(!idDetail){
            return res.status(404).json({ message: "No existe ese Detalle de Venta"})
        }
        await idDetail.destroy()
        res.json({ message:"Detalle de Venta borrado de la base de datos"});

    }catch{
        handleHttp(res, 'ERROR_DELETING_DETAILSALE')
    }
}


export { getDetail,getDetails,postDetail,putDetail,deleteDetail };
