export interface bookinterface{
    ID_libro: string;
    Titulo: string;
    Autor: string;
    Genero: string;
    ISBN: string;
    Cantidad: number; 
    Anio_publicacion: number; 
    Imagen: Buffer;
    Resumen: string;
    Disponibilidad: "Disponible" | "No Disponible";
}