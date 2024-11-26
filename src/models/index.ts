import { sequelize } from '../config/sql';
import { Book } from './books.model';
import { Carrito } from './cart.model';
import { Detail } from './detailsales.model';
import { MetodosPago } from './pagos.model';
import { Pago_Pendiente } from './pagos_pendientes.model';
import { Personal } from './personal.model';
import { Prestamos } from './Prestamos.model';
import { Resenas } from './Resenas.model';
import { Reservas } from './Reservas.model';
import { Venta } from './sales.model';
import { Sucursales } from './sucursales.model';
import { Tokens } from './Tokens.model';
import { user } from './users.model';
// Establece las relaciones después de que ambos modelos se hayan cargado

//Relaciones de Libros
Book.hasMany(Reservas, { foreignKey: 'ID_Libro' });
Reservas.belongsTo(Book, { foreignKey: 'ID_Libro', targetKey: 'ID' });

Book.hasMany(Resenas, { foreignKey: 'ID_Libro' });
Resenas.belongsTo(Book, { foreignKey: 'ID_Libro', targetKey: 'ID' });

Book.hasMany(Detail, { foreignKey: 'ID_Libro' });
Detail.belongsTo(Book, { foreignKey: 'ID_Libro', targetKey: 'ID' });

Book.hasMany(Carrito, { foreignKey: 'ID_Libro' });
Carrito.belongsTo(Book, { foreignKey: 'ID_Libro', targetKey: 'ID' });

Book.hasMany(Prestamos, { foreignKey: 'ID_Libro' });
Prestamos.belongsTo(Book, { foreignKey: 'ID_Libro', targetKey: 'ID' });

//Relaciones de Usuarios
user.hasOne(Resenas, { foreignKey: 'ID_Usuario' });
Resenas.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID' });

user.hasMany(Venta, { foreignKey: 'ID_Usuario' });
Venta.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID' });

user.hasMany(Reservas, { foreignKey: 'ID_Usuario' });
Reservas.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID' });

user.hasMany(Carrito, { foreignKey: 'ID_Usuario' });
Carrito.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID' });

user.hasMany(Prestamos, { foreignKey: 'ID_Usuario' });
Prestamos.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID' });

user.hasOne(Tokens, { foreignKey: 'ID_Usuario' });
Tokens.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID' });

user.hasMany(MetodosPago, { foreignKey: 'ID_Usuario' });
MetodosPago.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID' });

user.hasMany(Sucursales, { foreignKey: 'ID_Usuario' });
Sucursales.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID' });

// Relaciones de Ventas
Venta.hasMany(Detail, { foreignKey: 'ID_Venta' });
Detail.belongsTo(Venta, { foreignKey: 'ID_Venta'});

//Relaciones de Sucursales
Sucursales.hasMany(Book, { foreignKey: 'ID_Sucursal' });
Book.belongsTo(Sucursales, { foreignKey: 'ID_Sucursal', targetKey: 'ID'});

//Relaciones de Metodos de Pago
MetodosPago.hasMany(Venta, { foreignKey: 'ID_Metodo_Pago', onDelete: 'NO ACTION' });
Venta.belongsTo(MetodosPago, { foreignKey: 'ID_Metodo_Pago', onDelete: 'NO ACTION', targetKey: 'ID'});

//Relaciones de Personal
user.hasOne(Personal, { foreignKey: 'ID_Usuario' });
Personal.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID'});

Sucursales.hasMany(Personal, { foreignKey: 'ID_Sucursal' });
Personal.belongsTo(Sucursales, { foreignKey: 'ID_Sucursal', targetKey: 'ID'});

//Relaciones de Pagos Pendientes
Venta.hasOne(Pago_Pendiente, { foreignKey: 'ID_Venta', onDelete: 'NO ACTION'  });
Pago_Pendiente.belongsTo(Venta, { foreignKey: 'ID_Venta', onDelete: 'NO ACTION' });

user.hasMany(Pago_Pendiente, { foreignKey: 'ID_Usuario' });
Pago_Pendiente.belongsTo(user, { foreignKey: 'ID_Usuario',targetKey: 'ID'});

// Si estás usando sincronización automática:
sequelize.sync({ force: false })  // Si deseas borrar y recrear las tablas, usa `force: true`, pero en producción, mejor usa `force: false`.
.then(() => {
  console.log('Modelos sincronizados correctamente');
})
.catch((error) => {
  console.error('Error al sincronizar los modelos:', error);
});
