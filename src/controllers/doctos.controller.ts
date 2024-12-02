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
                    as:'Ejemplar',
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
        let page = pdfDoc.addPage([600, 800]); // Tamaño carta aproximado
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Configuración de la página
        const { width, height } = page.getSize();
        const margin = 50;
        let yPosition = height - margin;

        // Título
        page.drawText('Recibo de Compra', {
            x: margin,
            y: yPosition,
            size: 24,
            font: helveticaBold,
            color: rgb(0, 0, 0)
        });
        yPosition -= 40;

        // Información de la venta
        page.drawText(`Número de Venta: ${venta.ID_Venta}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 20;

        page.drawText(`Fecha: ${new Date(venta.Fecha_Venta).toLocaleDateString()}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 40;

        // Información del cliente
        page.drawText('Información del Cliente:', {
            x: margin,
            y: yPosition,
            size: 14,
            font: helveticaBold
        });
        yPosition -= 20;

        page.drawText(`Nombre: ${venta.nombre_cliente}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 20;

        page.drawText(`Correo: ${venta.correo_cliente}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 40;

        // Tabla de productos
        const tableTop = yPosition;
        const tableHeaders = ['Título', 'Cantidad', 'Precio', 'Subtotal'];
        const columnWidths = [250, 80, 100, 100];
        let xPosition = margin;

        // Encabezados de la tabla
        tableHeaders.forEach((header, index) => {
            page.drawText(header, {
                x: xPosition,
                y: tableTop,
                size: 12,
                font: helveticaBold
            });
            xPosition += columnWidths[index];
        });
        yPosition = tableTop - 20;

        // Detalles de productos
        detallesVenta.forEach(detalle => {
            xPosition = margin;
            const subtotal = detalle.Cantidad * detalle.Precio;

            page.drawText(detalle.Titulo, {
                x: xPosition,
                y: yPosition,
                size: 10,
                font: helveticaFont
            });
            xPosition += columnWidths[0];

            page.drawText(detalle.Cantidad.toString(), {
                x: xPosition,
                y: yPosition,
                size: 10,
                font: helveticaFont
            });
            xPosition += columnWidths[1];

            page.drawText(`$${detalle.Precio.toFixed(2)}`, {
                x: xPosition,
                y: yPosition,
                size: 10,
                font: helveticaFont
            });
            xPosition += columnWidths[2];

            page.drawText(`$${subtotal.toFixed(2)}`, {
                x: xPosition,
                y: yPosition,
                size: 10,
                font: helveticaFont
            });

            yPosition -= 20;
        });
        
        //Cargos
        // yPosition -= 0; // Espacio adicional antes de los cargos
        xPosition = margin;
        
        // Título "Cargos"
        page.drawText("Cargos por servicio", {
            x: xPosition,
            y: yPosition,
            size: 10,
            font: helveticaFont
        });
        
        // Mover a la última columna para el monto
        xPosition = margin + columnWidths[0] + columnWidths[1] + columnWidths[2];
        
        // Monto de los cargos
        page.drawText("$4.00", {
            x: xPosition,
            y: yPosition,
            size: 10,
            font: helveticaFont
        });

        // Total y método de pago
        yPosition -= 30;
        page.drawText(`Total: $${venta.Total.toFixed(2)}`, {
            x: width - margin - 150,
            y: yPosition,
            size: 14,
            font: helveticaBold
        });
        yPosition -= 20;

        page.drawText(`Método de Pago: ${venta.ID_Metodo_Pago ? 'Pago con Tarjeta' : 'Pago en Efectivo'}`, {
            x: width - margin - 190,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });

        // Pie de página
        page.drawText('Gracias por su compra', {
            x: width / 2 - 50,
            y: margin,
            size: 10,
            font: helveticaFont
        });

        // Generar el PDF
        const pdfBytes = await pdfDoc.save();

        // Enviar el PDF como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=recibo-${venta.ID_Venta}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Error completo:', error);
        handleHttp(res, 'ERROR_GENERAR_RECIBO');
    }
};

const generarFactura = async (req: Request, res: Response) => {
    
}

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
        let yPosition = height - margin - 20;

        // Título y fecha del informe
        page.drawText('Informe de Préstamos', {
            x: margin,
            y: yPosition,
            size: 24,
            font: helveticaBold,
            color: rgb(0, 0, 0)
        });
        yPosition -= 30;

        const fechaActual = new Date().toLocaleDateString();
        page.drawText(`Fecha de generación: ${fechaActual}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 40;

        // Resumen
        const prestamosActivos = prestamos.filter(p => p.Estado === 'Pendiente').length;
        const prestamosDevueltos = prestamos.filter(p => p.Estado === 'Devuelto').length;

        page.drawText('Resumen:', {
            x: margin,
            y: yPosition,
            size: 14,
            font: helveticaBold
        });
        yPosition -= 20;

        page.drawText(`Total de préstamos: ${prestamos.length}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 20;

        page.drawText(`Préstamos activos: ${prestamosActivos}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 20;

        page.drawText(`Préstamos devueltos: ${prestamosDevueltos}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 40;

        // Tabla de préstamos
        const tableHeaders = ['ID', 'Usuario', 'Libro', 'Sucursal', 'Fecha Préstamo', 'Fecha Devolución', 'Estado'];
        const columnWidths = [40, 80, 120, 80, 90, 90, 80];
        let xPosition = margin;

        // Encabezados de la tabla
        tableHeaders.forEach((header, index) => {
            page.drawText(header, {
                x: xPosition,
                y: yPosition,
                size: 10,
                font: helveticaBold
            });
            xPosition += columnWidths[index];
        });
        yPosition -= 20;

        // Contenido de la tabla
        prestamos.forEach(prestamo => {
            // Si no hay suficiente espacio en la página actual, crear una nueva
            if (yPosition < margin + 50) {
                page = pdfDoc.addPage([600, 800]);
                yPosition = height - margin;
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

            // Libro
            page.drawText(prestamo.titulo_libro, {
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

            // Fecha Préstamo
            page.drawText(new Date(prestamo.Fecha_prestamo).toLocaleDateString(), {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[4];

            // Fecha Devolución
            page.drawText(new Date(prestamo.Fecha_devolucion_prevista).toLocaleDateString(), {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[5];

            // Estado
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

        // Generar el PDF
        const pdfBytes = await pdfDoc.save();

        // Enviar el PDF como respuesta
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
        console.log(tipo, fechaInicio, fechaFin);
        // Consultas según el tipo de reporte
        switch (tipo) {
            case 'inventario':
                data = await Ejemplares.findAll({
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
                            attributes: []
                        },
                        {
                            model: Sucursales,
                            as: 'Sucursales',
                            attributes: []
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
                        attributes: []
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
                        }
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
                        }
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
                        }
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
                        }
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

            default:
                return res.status(400).json({ message: 'Tipo de reporte no válido' });
        }

        // Generar PDF con los datos
        const pdfDoc = await PDFDocument.create();
        let page:any = pdfDoc.addPage([600, 800]);
        const { width, height } = page.getSize();
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Título del reporte
        page.drawText(`Reporte: ${tipo.toUpperCase()}`, {
            x: 50,
            y: height - 50,
            size: 20,
            font: helveticaBold
        });

        // Fecha de generación
        const fechaGeneracion = new Date().toLocaleDateString();
        page.drawText(`Fecha de generación: ${fechaGeneracion}`, {
            x: 50,
            y: height - 80,
            size: 12,
            font: helveticaFont
        });

        // Contenido del reporte (adaptar según el tipo)
        let yPosition = height - 120;
        const margin = 50;
        const lineHeight = 20;

        // Función auxiliar para limpiar texto
        const limpiarTexto = (texto: any): string => {
            if (texto === null || texto === undefined) return '';
            // Convertir a string y eliminar caracteres especiales
            return String(texto)
                .replace(/[\u200B-\u200F\uFEFF]/g, '') // Elimina caracteres de formato invisible
                .replace(/[^\x20-\x7E\xA0-\xFF]/g, '') // Mantiene solo caracteres imprimibles básicos
                .trim();
        };

        data.forEach((item, index) => {
            if (yPosition < margin + 50) {
                const newPage = pdfDoc.addPage([600, 800]);
                yPosition = height - margin;
                page = newPage;
            }

            Object.entries(item).forEach(([key, value]) => {
                try {
                    const textoLimpio = `${limpiarTexto(key)}: ${limpiarTexto(value)}`;
                    
                    // Verificar si hay suficiente espacio en la página
                    if (yPosition < margin + 50) {
                        const newPage = pdfDoc.addPage([600, 800]);
                        yPosition = height - margin;
                        page = newPage;
                    }

                    page.drawText(textoLimpio, {
                        x: margin,
                        y: yPosition,
                        size: 10,
                        font: helveticaFont,
                        lineHeight: lineHeight
                    });
                    
                    yPosition -= lineHeight;
                } catch (error) {
                    console.warn(`Error al procesar campo ${key}:`, error);
                    // Continuar con el siguiente campo
                }
            });
            yPosition -= 10; // Espacio entre registros
        });

        const pdfBytes = await pdfDoc.save();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=reporte-${tipo}-${fechaGeneracion}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.log('Error al generar reporte:', error);
        handleHttp(res, 'ERROR_GENERAR_REPORTE');
    }
};

export { generarRecibo, generarInformePrestamos, generarReporte };
