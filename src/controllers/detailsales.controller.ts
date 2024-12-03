import { Request, Response } from "express"
import { handleHttp } from "../utils/error.handle";
import { Detail } from "../models/detailsales.model";
import { Sequelize } from "sequelize";
import { Book } from "../models/books.model";
import { Ejemplares } from "../models/ejemplares.model";
import { Sucursales } from "../models/sucursales.model";
import { Venta } from "../models/sales.model";
import { user } from "../models/users.model";
import Facturapi from "facturapi";
const facturapi = new Facturapi(`${process.env.FACTURAPI_KEY}`);

const getDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const idSale = await Detail.findAll({
            where: {
                ID_Venta: parseInt(id)
            },
            attributes: [
                'ID_Detalle',
                'ID_Venta',
                'ID_Ejemplar',
                'Cantidad',
                'Precio',
                [Sequelize.col('Ejemplar.Book.Titulo'), 'Titulo'],
                [Sequelize.col('Ejemplar.Book.Autor'), 'Autor'],
                [Sequelize.col('Ejemplar.Book.Imagen'), 'Imagen'],
                [Sequelize.col('Ejemplar.Sucursales.Nombre'), 'Sucursal']
            ],
            include: [{
                model: Ejemplares,
                as: 'Ejemplar',
                attributes: [],
                include: [{
                    model: Book,
                    attributes: []
                },
                {
                    model: Sucursales,
                    as: 'Sucursales',
                    attributes: []
                }]
            }],
            raw: true,
        });
        return idSale ? res.json(idSale) : res.status(404).json({ message: "No existe ese Detalle de Venta"});
    } catch (error) {
        console.log(error)
        handleHttp(res, 'ERROR_GET_DETAILSALE', error);
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

const postDetail = async(req: Request, res: Response) => {
    let newDetails: any[] = [];
    let Detalles: any[] = [];
    try {
        const { id } = req.params;
        const Detalles = req.body.Detalles;

        Detalles.forEach(async (detalle:any) => {
            try {
                // Verificar stock del ejemplar
                const ejemplar = await Ejemplares.findByPk(parseInt(detalle.ID_Ejemplar));
                if (!ejemplar || ejemplar.Cantidad < detalle.Cantidad) {
                    throw new Error(`Stock insuficiente para el ejemplar ${detalle.ID_Ejemplar}`);
                }
        
                // Crear el detalle
                const newDetail = await Detail.create({
                    ID_Venta: parseInt(id),
                    ID_Ejemplar: detalle.ID_Ejemplar,
                    Cantidad: detalle.Cantidad,
                    Precio: ejemplar.Precio // Usar el precio del ejemplar
                });
        
                // Actualizar el stock
                await ejemplar.update({
                    Cantidad: ejemplar.Cantidad - detalle.Cantidad
                });
        
                const libro = await Book.findByPk(ejemplar.ID_Libro);
                if (libro) {
                    Detalles.push({
                        ID_Libro: ejemplar.ID_Libro,
                        Titulo: libro.Titulo,
                        Cantidad: detalle.Cantidad,
                        Precio: ejemplar.Precio
                    });
                }
        
                newDetails.push(newDetail);
            } catch (error) {
                console.error('Error al procesar el detalle:', error);
            }
        });        

        const venta = await Venta.findByPk(parseInt(id));
        if (!venta) {
            throw new Error('Venta no encontrada');
        }
        const usuario = await user.findByPk(venta.ID_Usuario)
        if(!usuario){
            throw new Error('Usuario no encontrado')
        }
        const factura = await transDatosFactura(venta, Detalles,usuario);
        facturapi.invoices.create(factura)
        .then(async invoice => {
            console.log(invoice)
            await venta.update({ID_Factura:invoice.id})
        });
        res.status(201).json({
            message: "Detalles de Venta creados correctamente",
            detalles: newDetails
        });
    } catch (error) {
        // Rollback: restaurar cantidades si algo falla
        for (const detail of newDetails) {
            const ejemplar = await Ejemplares.findByPk(detail.ID_Ejemplar);
            if (ejemplar) {
                await ejemplar.update({
                    Cantidad: ejemplar.Cantidad + detail.Cantidad
                });
            }
            await detail.destroy();
        }
        handleHttp(res, 'ERROR_POSTING_DETAILSALE', error);
    }
}

// Funcion para retornar el JSON que se envía a Facturapi
const transDatosFactura = async (venta:Venta,detalles:any,usuario:user) =>{
    if (!venta) {
        throw new Error('Venta no proporcionada');
    }
    
    if (!detalles || detalles.length === 0) {
        throw new Error('Detalles de la venta no proporcionados');
    }
    
    // Transformar la venta en el formato que requiere FacturAPI
    const factura = {
        customer: {
            legal_name: usuario.Nombre_completo, // Suponiendo que esto es fijo, puedes obtenerlo del cliente
            email: usuario.Correo, // También puedes obtenerlo desde el cliente
            tax_id: 'XAXX010101000', // RFC del cliente
            tax_system: '601', // Regimen fiscal, ejemplo: "601" es el más común (Régimen general de ley)
            address: {
                zip: '81223', // Código postal del cliente
            },
        },
        items: detalles.map((detalle:any) => ({
            quantity: detalle.Cantidad,
            product: {
            description: detalle.Titulo, // Puedes obtener esto de una tabla de productos
            product_key: "90111800", // ClaveProdServ del SAT, es necesario definirla para cada producto
            price: detalle.Precio,
            taxes: [
                {
                type: 'IVA',
                rate: 0.16, // Tasa de IVA del producto
                },
            ],
            },
        })),
        use: 'S01', // Uso del CFDI, puedes ajustarlo según el tipo de factura
        payment_form: venta.ID_Metodo_Pago === null ? '01':'28', // Forma de pago, en este caso "Tarjeta de débito"
    };

    return factura;
}

const putDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { ID_Ejemplar, Cantidad } = req.body;
        
        const detalle = await Detail.findByPk(id);
        if (!detalle) {
            return res.status(404).json({ message: "No existe ese Detalle de Venta" });
        }

        // Si hay cambio de cantidad, verificar stock
        if (Cantidad !== detalle.Cantidad) {
            const ejemplar = await Ejemplares.findByPk(ID_Ejemplar);
            if (!ejemplar) {
                return res.status(404).json({ message: "No existe el ejemplar" });
            }

            const diferenciaCantidad = Cantidad - detalle.Cantidad;
            if (ejemplar.Cantidad < diferenciaCantidad) {
                return res.status(400).json({ message: "Stock insuficiente para la actualización" });
            }

            // Actualizar stock
            await ejemplar.update({
                Cantidad: ejemplar.Cantidad - diferenciaCantidad
            });
        }

        // Actualizar detalle
        await detalle.update({
            ID_Ejemplar,
            Cantidad,
            Precio: req.body.Precio || detalle.Precio
        });

        res.json(detalle);
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATING_DETAILSALE', error);
    }
}

const deleteDetail = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const detalle = await Detail.findByPk(id);
        
        if (!detalle) {
            return res.status(404).json({ message: "No existe ese Detalle de Venta" });
        }

        // Restaurar el stock
        const ejemplar = await Ejemplares.findByPk(detalle.ID_Ejemplar);

        if (ejemplar) {
            await ejemplar.update({
                Cantidad: ejemplar.Cantidad + detalle.Cantidad
            });
        }

        await detalle.destroy();
        res.json({ message: "Detalle de Venta borrado y stock actualizado" });
    } catch (error) {
        handleHttp(res, 'ERROR_DELETING_DETAILSALE', error);
    }
}


export { getDetail,getDetails,postDetail,putDetail,deleteDetail };
