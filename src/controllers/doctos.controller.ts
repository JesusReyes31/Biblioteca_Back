import { Request, Response } from "express";
import { Venta } from "../models/sales.model";
import { Detail } from "../models/detailsales.model";
import { Book } from "../models/books.model";
import { user } from "../models/users.model";
import { handleHttp } from "../utils/error.handle";
import { Sequelize } from "sequelize";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import { Prestamos } from "../models/Prestamos.model";
import { Ejemplares } from "../models/ejemplares.model";
import { Sucursales } from "../models/sucursales.model";
import { Op } from 'sequelize';
import Facturapi from "facturapi";
import { error } from "console";
import { Pago_Pendiente } from "../models/pagos_pendientes.model";
const facturapi = new Facturapi(`${process.env.FACTURAPI_KEY}`);

const generarRecibo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const venta: any = await Venta.findOne({
            where: { ID_Venta: parseInt(id) },
            attributes: [
                'ID_Venta',
                'Fecha_Venta',
                'Total',
                'ID_Metodo_Pago',
                [Sequelize.col('user.Nombre_completo'), 'nombre_cliente'],
                [Sequelize.col('user.Correo'), 'correo_cliente']
            ],
            include: [
                {
                    model: user,
                    attributes: []
                }
            ],
            raw: true
        });

        if (!venta) {
            return res.status(404).json({ message: "Venta no encontrada" });
        }

        const detallesVenta: any[] = await Detail.findAll({
            where: { ID_Venta: parseInt(id) },
            attributes: [
                'Cantidad',
                [Sequelize.col('Ejemplar.Book.Titulo'), 'Titulo'],
                [Sequelize.col('Ejemplar.Precio'), 'Precio']
            ],
            include: [
                {
                    model: Ejemplares,
                    as: 'Ejemplar',
                    attributes: [],
                    include: [{
                        model: Book,
                        attributes: []
                    }]
                }
            ],
            raw: true
        });

        // Crear el PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Configuración de la página
        const { width, height } = page.getSize();
        const margin = 50;
        let yPosition = height - margin;

        // Encabezado con fondo
        page.drawRectangle({
            x: 0,
            y: height - 120,
            width,
            height: 120,
            color: rgb(0.12, 0.29, 0.49)
        });

        // Logo o Título
        page.drawText('LIBRERÍA', {
            x: margin,
            y: yPosition,
            size: 28,
            font: helveticaBold,
            color: rgb(1, 1, 1)
        });
        yPosition -= 25;

        page.drawText('RECIBO DE COMPRA', {
            x: margin,
            y: yPosition,
            size: 16,
            font: helveticaBold,
            color: rgb(1, 1, 1)
        });
        yPosition -= 40;

        // Información de la venta con fondo gris claro
        page.drawRectangle({
            x: margin - 10,
            y: yPosition - 60,
            width: width - (2 * margin) + 20,
            height: 70,
            color: rgb(0.95, 0.95, 0.95)
        });

        page.drawText(`Folio: #${venta.ID_Venta.toString().padStart(6, '0')}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaBold
        });
        
        console.log(venta.Fecha_Venta)
        page.drawText(`Fecha de Venta: ${new Date(venta.Fecha_Venta).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })}`, {
            x: width - margin - 200,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 25;

        // Información del cliente
        page.drawText(`Cliente: ${venta.nombre_cliente}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 25;

        page.drawText(`Correo: ${venta.correo_cliente}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 40;

        // Tabla de productos
        const tableTop = yPosition;
        const tableHeaders = ['Título', 'Cantidad', 'Precio Unit.', 'Subtotal'];
        const columnWidths = [280, 80, 90, 90];

        // Fondo del encabezado de la tabla
        page.drawRectangle({
            x: margin - 5,
            y: tableTop - 5,
            width: width - (2 * margin) + 10,
            height: 30,
            color: rgb(0.12, 0.29, 0.49)
        });

        // Encabezados de la tabla
        let xPosition = margin;
        tableHeaders.forEach((header, index) => {
            page.drawText(header, {
                x: xPosition,
                y: tableTop + 7,
                size: 12,
                font: helveticaBold,
                color: rgb(1, 1, 1)
            });
            xPosition += columnWidths[index];
        });
        yPosition = tableTop - 30;

        // Detalles de productos
        detallesVenta.forEach((detalle, index) => {
            // Fondo alternado para las filas
            if (index % 2 === 0) {
                page.drawRectangle({
                    x: margin - 5,
                    y: yPosition - 5,
                    width: width - (2 * margin) + 10,
                    height: 25,
                    color: rgb(0.95, 0.95, 0.95)
                });
            }

            xPosition = margin;
            const subtotal = detalle.Cantidad * detalle.Precio;

            // Título (truncado si es muy largo)
            const tituloTruncado = detalle.Titulo.length > 45 
                ? detalle.Titulo.substring(0, 42) + '...' 
                : detalle.Titulo;
            
            page.drawText(tituloTruncado, {
                x: xPosition,
                y: yPosition + 5,
                size: 10,
                font: helveticaFont
            });
            xPosition += columnWidths[0];

            page.drawText(detalle.Cantidad.toString(), {
                x: xPosition + 30,
                y: yPosition + 5,
                size: 10,
                font: helveticaFont
            });
            xPosition += columnWidths[1];

            page.drawText(`$${detalle.Precio.toFixed(2)}`, {
                x: xPosition + 20,
                y: yPosition + 5,
                size: 10,
                font: helveticaFont
            });
            xPosition += columnWidths[2];

            page.drawText(`$${venta.Total.toFixed(2)-4}`, {
                x: xPosition + 20,
                y: yPosition + 5,
                size: 10,
                font: helveticaFont
            });

            yPosition -= 30;
        });

        // Cargos por servicio
        page.drawText("Cargos por servicio", {
            x: margin,
            y: yPosition + 5,
            size: 10,
            font: helveticaFont
        });
        
        page.drawText("$4.00", {
            x: width - margin - 70,
            y: yPosition + 5,
            size: 10,
            font: helveticaFont
        });

        // Total y método de pago con fondo
        yPosition -= 40;
        page.drawRectangle({
            x: width - margin - 200,
            y: yPosition - 50,
            width: 200,
            height: 70,
            color: rgb(0.95, 0.95, 0.95)
        });

        page.drawText(`Total:`, {
            x: width - margin - 180,
            y: yPosition + 5,
            size: 14,
            font: helveticaBold
        });

        page.drawText(`$${venta.Total.toFixed(2)}`, {
            x: width - margin - 70,
            y: yPosition + 5,
            size: 14,
            font: helveticaBold
        });
        yPosition -= 25;

        page.drawText(`Método de Pago:`, {
            x: width - margin - 180,
            y: yPosition + 5,
            size: 12,
            font: helveticaFont
        });

        page.drawText(venta.ID_Metodo_Pago ? 'Tarjeta' : 'Efectivo', {
            x: width - margin - 70,
            y: yPosition + 5,
            size: 12,
            font: helveticaFont
        });

        // Pie de página
        page.drawText('¡Gracias por su compra!', {
            x: width / 2 - 50,
            y: margin,
            size: 12,
            font: helveticaBold,
            color: rgb(0.5, 0.5, 0.5)
        });

        // Generar y enviar el PDF
        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=recibo-${venta.ID_Venta}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Error completo:', error);
        handleHttp(res, 'ERROR_GENERAR_RECIBO');
    }
};

const generarFactura = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const venta = await Venta.findByPk(parseInt(id));
        
        if (!venta?.ID_Factura) {
            return res.status(404).json({ message: "Factura no encontrada" });
        }

        const pendiente = await Pago_Pendiente.findOne({where:{ID_Venta:venta.ID_Venta}});
        if(pendiente){
            return res.status(404).json({ message: "No se puede cargar la factura, aun no se ha realizado el pago" });
        }

        const response = await fetch(
            `https://www.facturapi.io/v2/invoices/${venta.ID_Factura}/pdf`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.FACTURAPI_KEY}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Error al obtener la factura: ${response.statusText}`);
        }

        const buffer = Buffer.from(await response.arrayBuffer());

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=factura-${venta.ID_Factura}.pdf`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);

    } catch (error) {
        console.error('Error al generar factura:', error);
        handleHttp(res, 'ERROR_GENERAR_FACTURA');
    }
};

const generarInformePrestamos = async (req: Request, res: Response) => {
    try {
        // Obtener todos los préstamos con información relacionada
        const prestamos: any[] = await Prestamos.findAll({
            where: {
                '$Ejemplar.ID_Sucursal$': req.body.user.User.ID_Sucursal
            },
            attributes: [
                'ID_Prestamo',
                'Fecha_prestamo',
                'Fecha_devolucion_prevista',
                'Estado',
                [Sequelize.col('user.Nombre_Usuario'), 'nombre_usuario'],
                [Sequelize.col('Ejemplar.Book.Titulo'), 'titulo_libro'],
                [Sequelize.col('Ejemplar.Sucursales.Nombre'), 'sucursal']
            ],
            include: [
                {
                    model: user,
                    attributes: []
                },
                {
                    model: Ejemplares,
                    as: 'Ejemplar',
                    attributes: [],
                    include: [
                        {
                            model: Book,
                            attributes: []
                        },
                        {
                            model: Sucursales,
                            as: 'Sucursales',
                            attributes: []
                        }
                    ]
                }
            ],
            raw: true
        });

        // Crear el PDF
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([600, 800]); // Tamaño carta
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Configuración de la página
        const { width, height } = page.getSize();
        const margin = 35;

        // Si no hay datos, crear un PDF con mensaje
        if (prestamos.length === 0) {
            // Encabezado
            page.drawRectangle({
                x: 0,
                y: height - 100,
                width,
                height: 100,
                color: rgb(0.12, 0.29, 0.49)
            });

            // Título
            page.drawText('INFORME DE PRÉSTAMOS', {
                x: margin,
                y: height - 60,
                size: 24,
                font: helveticaBold,
                color: rgb(1, 1, 1)
            });

            // Fecha
            const fechaActual = new Date().toLocaleDateString();
            page.drawText(`Fecha de generación: ${fechaActual}`, {
                x: margin,
                y: height - 85,
                size: 12,
                font: helveticaFont,
                color: rgb(1, 1, 1)
            });

            // Mensaje central
            page.drawText('No hay préstamos registrados para mostrar', {
                x: width / 2 - 150,
                y: height / 2,
                size: 16,
                font: helveticaBold,
                color: rgb(0.5, 0.5, 0.5)
            });

            const pdfBytes = await pdfDoc.save();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=informe-prestamos-${fechaActual}.pdf`);
            res.send(Buffer.from(pdfBytes));
            return;
        }

        let yPosition = height - margin - 20;

        // Encabezado con fondo
        page.drawRectangle({
            x: 0,
            y: height - 100,
            width,
            height: 100,
            color: rgb(0.12, 0.29, 0.49)
        });

        // Título y fecha del informe
        page.drawText('INFORME DE PRÉSTAMOS', {
            x: margin,
            y: yPosition,
            size: 24,
            font: helveticaBold,
            color: rgb(1, 1, 1)
        });
        yPosition -= 30;

        const fechaActual = new Date().toLocaleDateString();
        page.drawText(`Fecha de generación: ${fechaActual}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont,
            color: rgb(1, 1, 1)
        });
        yPosition -= 40;

        // Resumen con fondo
        const prestamosActivos = prestamos.filter(p => p.Estado === 'Pendiente').length;
        const prestamosDevueltos = prestamos.filter(p => p.Estado === 'Devuelto').length;

        page.drawRectangle({
            x: margin - 10,
            y: yPosition - 70,
            width: width - (2 * margin) + 20,
            height: 90,
            color: rgb(0.95, 0.95, 0.95)
        });

        page.drawText('RESUMEN', {
            x: margin,
            y: yPosition,
            size: 14,
            font: helveticaBold,
            color: rgb(0.2, 0.2, 0.2)
        });
        yPosition -= 25;

        page.drawText(`Total de préstamos: ${prestamos.length}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2)
        });
        yPosition -= 20;

        page.drawText(`Préstamos activos: ${prestamosActivos}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont,
            color: prestamosActivos > 0 ? rgb(0.9, 0.3, 0.3) : rgb(0.2, 0.2, 0.2)
        });
        yPosition -= 20;

        page.drawText(`Préstamos devueltos: ${prestamosDevueltos}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont,
            color: rgb(0.2, 0.7, 0.2)
        });
        yPosition -= 40;

        // Tabla de préstamos
        const tableHeaders = ['ID', 'Usuario', 'Libro', 'Sucursal', 'Fecha Préstamo', 'Fecha Devolución', 'Estado'];
        const columnWidths = [40, 80, 120, 80, 90, 90, 80];
        let xPosition = margin;

        // Fondo del encabezado de la tabla
        page.drawRectangle({
            x: margin - 5,
            y: yPosition - 5,
            width: width - (2 * margin) + 10,
            height: 25,
            color: rgb(0.12, 0.29, 0.49)
        });

        // Encabezados de la tabla
        tableHeaders.forEach((header, index) => {
            page.drawText(header, {
                x: xPosition,
                y: yPosition+7,
                size: 10,
                font: helveticaBold,
                color: rgb(1, 1, 1)
            });
            xPosition += columnWidths[index];
        });
        yPosition -= 20;

        // Contenido de la tabla con filas alternadas
        prestamos.forEach((prestamo, index) => {
            // Si no hay suficiente espacio en la página actual, crear una nueva
            if (yPosition < margin + 50) {
                page = pdfDoc.addPage([600, 800]);
                yPosition = height - margin;
            }

            // Fondo alternado para las filas
            if (index % 2 === 0) {
                page.drawRectangle({
                    x: margin - 5,
                    y: yPosition - 5,
                    width: width - (2 * margin) + 10,
                    height: 20,
                    color: rgb(0.95, 0.95, 0.95)
                });
            }

            xPosition = margin;

            // ID
            page.drawText(prestamo.ID_Prestamo.toString(), {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[0];

            // Usuario
            page.drawText(prestamo.nombre_usuario, {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[1];

            // Libro (truncado si es muy largo)
            const tituloTruncado = prestamo.titulo_libro.length > 25 
                ? prestamo.titulo_libro.substring(0, 22) + '...' 
                : prestamo.titulo_libro;
            page.drawText(tituloTruncado, {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[2];

            // Sucursal
            page.drawText(prestamo.sucursal, {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[3];

            // Fechas formateadas
            page.drawText(new Date(prestamo.Fecha_prestamo).toLocaleDateString(), {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[4];

            page.drawText(new Date(prestamo.Fecha_devolucion_prevista).toLocaleDateString(), {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[5];

            // Estado con color
            const colorEstado = prestamo.Estado === 'Pendiente' ? rgb(0.9, 0.3, 0.3) : rgb(0.2, 0.7, 0.2);
            page.drawText(prestamo.Estado, {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont,
                color: colorEstado
            });

            yPosition -= 20;
        });

        // Pie de página
        page.drawText('Sistema de Gestión de Biblioteca', {
            x: width / 2 - 80,
            y: margin,
            size: 10,
            font: helveticaFont,
            color: rgb(0.5, 0.5, 0.5)
        });

        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=informe-prestamos-${fechaActual}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Error completo:', error);
        handleHttp(res, 'ERROR_GENERAR_INFORME_PRESTAMOS');
    }
};

const generarReporte = async (req: Request, res: Response) => {
    try {
        const { tipo, fechaInicio, fechaFin } = req.body;
        let data: any[] = [];
        const hasSucursal = req.body.user.User.ID_Sucursal;
        
        // Consultas según el tipo de reporte
        switch (tipo) {
            case 'inventario':
                data = await Ejemplares.findAll({
                    where: hasSucursal ? { ID_Sucursal: req.body.user.User.ID_Sucursal } : {},
                    attributes: [
                        [Sequelize.col('Book.Titulo'), 'Titulo'],
                        [Sequelize.col('Book.Autor'), 'Autor'],
                        [Sequelize.col('Book.ISBN'), 'ISBN'],
                        [Sequelize.col('Sucursales.Nombre'), 'Sucursal'],
                        'Cantidad',
                        'Precio'
                    ],
                    include: [
                        {
                            model: Book,
                            attributes: [],
                            required: true
                        },
                        {
                            model: Sucursales,
                            as: 'Sucursales',
                            attributes: [],
                            required: true
                        }
                    ],
                    raw: true
                });
                break;

            case 'libros-genero':
                data = await Book.findAll({
                    attributes: [
                        'Titulo',
                        'Autor',
                        'Genero',
                        [Sequelize.fn('COUNT', Sequelize.col('Ejemplares.ID')), 'Total_Ejemplares']
                    ],
                    include: [{
                        model: Ejemplares,
                        attributes: [],
                        where: hasSucursal ? { ID_Sucursal: req.body.user.User.ID_Sucursal } : {}
                    }],
                    group: ['Book.ID', 'Book.Titulo', 'Book.Autor', 'Book.Genero'],
                    raw: true
                });
                break;

            case 'prestamos-usuario':
                data = await Prestamos.findAll({
                    where: {
                        Fecha_prestamo: {
                            [Op.between]: [fechaInicio, fechaFin]
                        },
                        ...(hasSucursal && { '$Ejemplar.ID_Sucursal$': req.body.user.User.ID_Sucursal })
                    },
                    attributes: [
                        [Sequelize.col('user.Nombre_Usuario'), 'Usuario'],
                        [Sequelize.col('Ejemplar.Book.Titulo'), 'Libro'],
                        'Fecha_prestamo',
                        'Fecha_devolucion_prevista',
                        'Estado'
                    ],
                    include: [
                        {
                            model: user,
                            attributes: []
                        },
                        {
                            model: Ejemplares,
                            as: 'Ejemplar',
                            attributes: [],
                            include: [{
                                model: Book,
                                attributes: []
                            }]
                        }
                    ],
                    raw: true
                });
                break;

            case 'prestamos-genero':
                data = await Prestamos.findAll({
                    where: {
                        Fecha_prestamo: {
                            [Op.between]: [fechaInicio, fechaFin]
                        },
                        ...(hasSucursal && { '$Ejemplar.ID_Sucursal$': req.body.user.User.ID_Sucursal })
                    },
                    attributes: [
                        [Sequelize.col('Ejemplar.Book.Genero'), 'Genero'],
                        [Sequelize.fn('COUNT', Sequelize.col('Prestamos.ID_Prestamo')), 'Total_Prestamos']
                    ],
                    include: [{
                        model: Ejemplares,
                        as: 'Ejemplar',
                        attributes: [],
                        include: [{
                            model: Book,
                            attributes: []
                        }]
                    }],
                    group: ['Ejemplar.Book.Genero'],
                    raw: true
                });
                break;

            case 'pendientes':
                data = await Prestamos.findAll({
                    where: {
                        Estado: 'Pendiente',
                        Fecha_prestamo: {
                            [Op.between]: [fechaInicio, fechaFin]
                        },
                        ...(hasSucursal && { '$Ejemplar.ID_Sucursal$': req.body.user.User.ID_Sucursal })
                    },
                    attributes: [
                        [Sequelize.col('user.Nombre_Usuario'), 'Usuario'],
                        [Sequelize.col('Ejemplar.Book.Titulo'), 'Libro'],
                        'Fecha_prestamo',
                        'Fecha_devolucion_prevista'
                    ],
                    include: [
                        {
                            model: user,
                            attributes: []
                        },
                        {
                            model: Ejemplares,
                            as: 'Ejemplar',
                            attributes: [],
                            include: [{
                                model: Book,
                                attributes: []
                            }]
                        }
                    ],
                    raw: true
                });
                break;

            case 'ventas':
                data = await Venta.findAll({
                    where: {
                        Fecha_Venta: {
                            [Op.between]: [fechaInicio, fechaFin]
                        },
                        ...(hasSucursal && { '$Details.Ejemplar.ID_Sucursal$': req.body.user.User.ID_Sucursal })
                    },
                    attributes: [
                        'ID_Venta',
                        'Fecha_Venta',
                        'Total',
                        [Sequelize.col('user.Nombre_Usuario'), 'Cliente']
                    ],
                    include: [
                        {
                            model: user,
                            attributes: []
                        },
                        {
                            model: Detail,
                            attributes: ['Cantidad', 'Precio'],
                            include: [{
                                model: Ejemplares,
                                as: 'Ejemplar',
                                attributes: [],
                                include: [{
                                    model: Book,
                                    attributes: ['Titulo', 'Autor', 'ISBN']
                                }]
                            }]
                        }
                    ],
                    raw: true
                });
                break;

            case 'prestamos-libros':
                data = await Prestamos.findAll({
                    where: {
                        Fecha_prestamo: {
                            [Op.between]: [fechaInicio, fechaFin]
                        },
                        ...(hasSucursal && { '$Ejemplar.ID_Sucursal$': req.body.user.User.ID_Sucursal })
                    },
                    attributes: [
                        [Sequelize.col('Ejemplar.Book.Titulo'), 'Libro'],
                        [Sequelize.col('Ejemplar.Book.Autor'), 'Autor'],
                        [Sequelize.col('Ejemplar.Book.ISBN'), 'ISBN'],
                        [Sequelize.fn('COUNT', Sequelize.col('Prestamos.ID_Prestamo')), 'Total_Prestamos']
                    ],
                    include: [{
                        model: Ejemplares,
                        as: 'Ejemplar',
                        attributes: [],
                        include: [{
                            model: Book,
                            attributes: []
                        }]
                    }],
                    group: ['Ejemplar.Book.Titulo', 'Ejemplar.Book.Autor', 'Ejemplar.Book.ISBN'],
                    raw: true
                });
                break;

            default:
                return res.status(400).json({ message: 'Tipo de reporte no válido' });
        }

        // Formatear fechas en los datos
        data = data.map(item => {
            const newItem = { ...item };
            // Formatear fechas si existen en el objeto
            if (newItem.Fecha_Venta) {
                newItem.Fecha_Venta = new Date(newItem.Fecha_Venta).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
            if (newItem.Fecha_prestamo) {
                newItem.Fecha_prestamo = new Date(newItem.Fecha_prestamo).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
            if (newItem.Fecha_devolucion_prevista) {
                newItem.Fecha_devolucion_prevista = new Date(newItem.Fecha_devolucion_prevista).toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
            return newItem;
        });

        // Después de obtener los datos y antes de crear el PDF
        if (data.length === 0) {
            // Crear un PDF simple con mensaje de no datos
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([800, 1000]);
            const { width, height } = page.getSize();
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

            // Encabezado
            page.drawRectangle({
                x: 0,
                y: height - 100,
                width,
                height: 100,
                color: rgb(0.12, 0.29, 0.49) // Azul oscuro
            });

            // Título
            page.drawText(`REPORTE: ${tipo.toUpperCase()}`, {
                x: 50,
                y: height - 60,
                size: 24,
                font: helveticaBold,
                color: rgb(1, 1, 1)
            });

            // Fecha de generación
            const fechaGeneracion = new Date().toLocaleDateString();
            page.drawText(`Fecha de generación: ${fechaGeneracion}`, {
                x: 50,
                y: height - 85,
                size: 12,
                font: helvetica,
                color: rgb(1, 1, 1)
            });

            // Mensaje de no datos
            page.drawText('No hay información disponible para el reporte seleccionado', {
                x: width / 2 - 200,
                y: height / 2,
                size: 16,
                font: helveticaBold,
                color: rgb(0.5, 0.5, 0.5)
            });

            if (fechaInicio && fechaFin) {
                page.drawText(`Período consultado: ${new Date(fechaInicio).toLocaleDateString()} - ${new Date(fechaFin).toLocaleDateString()}`, {
                    x: width / 2 - 150,
                    y: height / 2 - 30,
                    size: 12,
                    font: helvetica,
                    color: rgb(0.5, 0.5, 0.5)
                });
            }

            const pdfBytes = await pdfDoc.save();
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename=reporte-${tipo}-${fechaGeneracion}.pdf`);
            res.send(Buffer.from(pdfBytes));
            return;
        }

        // Configuración del PDF
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([800, 1000]); // Página más grande
        const { width, height } = page.getSize();
        const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Colores
        const primaryColor = rgb(0.12, 0.29, 0.49);  // Azul oscuro
        const secondaryColor = rgb(0.93, 0.95, 0.98); // Gris muy claro
        const textColor = rgb(0.2, 0.2, 0.2);

        // Encabezado
        page.drawRectangle({
            x: 0,
            y: height - 100,
            width,
            height: 100,
            color: primaryColor
        });

        // Título
        page.drawText(`REPORTE: ${tipo.toUpperCase()}`, {
            x: 50,
            y: height - 60,
            size: 24,
            font: helveticaBold,
            color: rgb(1, 1, 1)
        });

        // Información del reporte
        const fechaGeneracion = new Date().toLocaleDateString();
        page.drawText(`Fecha de generación: ${fechaGeneracion}`, {
            x: 50,
            y: height - 85,
            size: 12,
            font: helvetica,
            color: rgb(1, 1, 1)
        });

        if (fechaInicio && fechaFin) {
            page.drawText(`Período: ${new Date(fechaInicio).toLocaleDateString()} - ${new Date(fechaFin).toLocaleDateString()}`, {
                x: width - 250,
                y: height - 85,
                size: 12,
                font: helvetica,
                color: rgb(1, 1, 1)
            });
        }

        // Configuración de la tabla
        let yPosition = height - 150;
        const margin = 50;
        const columnGap = 20;
        let rowCount = 0;
        const rowsPerPage = 25;

        // Obtener las columnas del primer elemento
        const columns = data.length > 0 ? Object.keys(data[0]) : [];
        const columnWidth = (width - (2 * margin) - (columnGap * (columns.length - 1))) / columns.length;

        const drawTableHeader = (yPos: number) => {
            // Fondo del encabezado
            page.drawRectangle({
                x: margin - 5,
                y: yPos - 5,
                width: width - (2 * margin) + 10,
                height: 30,
                color: primaryColor
            });

            let xPos = margin;
            columns.forEach(column => {
                page.drawText(column.toUpperCase(), {
                    x: xPos,
                    y: yPos + 7,
                    size: 11,
                    font: helveticaBold,
                    color: rgb(1, 1, 1)
                });
                xPos += columnWidth + columnGap;
            });
            return yPos - 35;
        };

        yPosition = drawTableHeader(yPosition);

        // Función auxiliar para limpiar texto
        const limpiarTexto = (texto: any): string => {
            if (texto === null || texto === undefined) return '';
            return String(texto)
                .replace(/[\u200B-\u200F\uFEFF]/g, '') // Elimina caracteres de formato invisible
                .replace(/[^\x20-\x7E\xA0-\xFF]/g, '') // Mantiene solo caracteres imprimibles básicos
                .trim();
        };

        // Dibujar filas
        data.forEach((item, index) => {
            if (rowCount >= rowsPerPage) {
                page = pdfDoc.addPage([800, 1000]);
                yPosition = height - 150;
                yPosition = drawTableHeader(yPosition);
                rowCount = 0;
            }

            // Fondo alternado para las filas
            if (index % 2 === 0) {
                page.drawRectangle({
                    x: margin - 5,
                    y: yPosition - 5,
                    width: width - (2 * margin) + 10,
                    height: 25,
                    color: secondaryColor
                });
            }

            let xPos = margin;
            columns.forEach(key => {
                const value = limpiarTexto(item[key]); // Aplicamos la limpieza aquí
                page.drawText(value.substring(0, 30), {
                    x: xPos,
                    y: yPosition + 5,
                    size: 10,
                    font: helvetica,
                    color: textColor
                });
                xPos += columnWidth + columnGap;
            });

            yPosition -= 30;
            rowCount++;
        });

        // Pie de página
        const drawFooter = (pageNum: number, totalPages: number) => {
            page.drawText(`Página ${pageNum} de ${totalPages}`, {
                x: width - 100,
                y: 30,
                size: 10,
                font: helvetica,
                color: textColor
            });
        };

        // Numerar páginas
        const totalPages = Math.ceil(data.length / rowsPerPage);
        for (let i = 0; i < totalPages; i++) {
            const currentPage = pdfDoc.getPage(i);
            drawFooter(i + 1, totalPages);
        }

        const pdfBytes = await pdfDoc.save();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=reporte-${tipo}-${fechaGeneracion}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.log(error);
        handleHttp(res, 'ERROR_GENERAR_REPORTE');
    }
};

const enviarFactura = async (req: Request, res: Response) => {
    try{
        const {id} = req.body;
        const venta = await Venta.findByPk(parseInt(id));
        await facturapi.invoices.sendByEmail(`${venta?.ID_Factura}`);
        res.status(200).json({message: 'Factura enviada correctamente'});
    }catch(error){
        handleHttp(res, 'ERROR_ENVIAR_FACTURA');
    }

}

export { generarRecibo, generarInformePrestamos, generarReporte,generarFactura, enviarFactura };
