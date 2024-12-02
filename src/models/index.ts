import { sequelize } from '../config/sql';
import { Book } from './books.model';
import { Carrito } from './cart.model';
import { Detail } from './detailsales.model';
import { Ejemplares } from './ejemplares.model';
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

// Relaciones de Libros con Ejemplares
Book.hasMany(Ejemplares, { foreignKey: 'ID_Libro' });
Ejemplares.belongsTo(Book, { foreignKey: 'ID_Libro', targetKey: 'ID', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

// Relaciones de Ejemplares con otras entidades
Ejemplares.hasMany(Reservas, { 
    foreignKey: 'ID_Ejemplar',
    sourceKey: 'ID'
});
Reservas.belongsTo(Ejemplares, { 
    foreignKey: 'ID_Ejemplar',
    targetKey: 'ID',
    as: 'Ejemplar'
});

Ejemplares.hasMany(Resenas, { 
    foreignKey: 'ID_Ejemplar',
    sourceKey: 'ID'
});
Resenas.belongsTo(Ejemplares, { 
    foreignKey: 'ID_Ejemplar',
    targetKey: 'ID',
    as: 'Resenas'
});

Ejemplares.hasMany(Detail, { 
    foreignKey: 'ID_Ejemplar',
    sourceKey: 'ID'
});
Detail.belongsTo(Ejemplares, { 
    foreignKey: 'ID_Ejemplar',
    targetKey: 'ID',
    as: 'Ejemplar'
});

Ejemplares.hasMany(Carrito, { 
    foreignKey: 'ID_Ejemplar',
    sourceKey: 'ID'
});
Carrito.belongsTo(Ejemplares, { 
    foreignKey: 'ID_Ejemplar',
    targetKey: 'ID',
    as: 'Ejemplar'
});

Ejemplares.hasMany(Prestamos, { 
    foreignKey: 'ID_Ejemplar',
    sourceKey: 'ID'
});
Prestamos.belongsTo(Ejemplares, { 
    foreignKey: 'ID_Ejemplar',
    targetKey: 'ID',
    as: 'Ejemplar'
});

// Relaciones con Sucursales
Sucursales.hasMany(Ejemplares, { foreignKey: 'ID_Sucursal'});
Ejemplares.belongsTo(Sucursales, { foreignKey: 'ID_Sucursal',targetKey: 'ID', as:'Sucursales', onDelete: 'CASCADE', onUpdate: 'CASCADE' });

// Relaciones de Usuarios
user.hasMany(Resenas, { 
    foreignKey: 'ID_Usuario',
    onDelete: 'CASCADE'
});
Resenas.belongsTo(user, { 
    foreignKey: 'ID_Usuario',
    targetKey: 'ID'
});

user.hasMany(Venta, { foreignKey: 'ID_Usuario' });
Venta.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID' });

user.hasMany(Reservas, { foreignKey: 'ID_Usuario' });
Reservas.belongsTo(user, { foreignKey: 'ID_Usuario', targetKey: 'ID' });

user.hasMany(Carrito, { 
    foreignKey: 'ID_Usuario', 
    onDelete: 'CASCADE' 
});

Carrito.belongsTo(user, { 
    foreignKey: 'ID_Usuario', 
    targetKey: 'ID' 
});

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
Detail.belongsTo(Venta, { foreignKey: 'ID_Venta' });

// Relaciones de Métodos de Pago
MetodosPago.hasMany(Venta, { foreignKey: 'ID_Metodo_Pago', onDelete: 'NO ACTION' });
Venta.belongsTo(MetodosPago, { foreignKey: 'ID_Metodo_Pago', onDelete: 'NO ACTION' });

// Relaciones de Personal
user.hasOne(Personal, { foreignKey: 'ID_Usuario' });
Personal.belongsTo(user, { foreignKey: 'ID_Usuario' });

Sucursales.hasMany(Personal, { foreignKey: 'ID_Sucursal' });
Personal.belongsTo(Sucursales, { foreignKey: 'ID_Sucursal' });

// Relaciones de Pagos Pendientes
Venta.hasOne(Pago_Pendiente, { foreignKey: 'ID_Venta', onDelete: 'NO ACTION' });
Pago_Pendiente.belongsTo(Venta, { foreignKey: 'ID_Venta', onDelete: 'NO ACTION' });

user.hasMany(Pago_Pendiente, { foreignKey: 'ID_Usuario' });
Pago_Pendiente.belongsTo(user, { foreignKey: 'ID_Usuario' });

sequelize.sync({ force: false })
.then(() => {
    console.log('Modelos sincronizados correctamente');
})
.catch((error) => {
    console.error('Error al sincronizar los modelos:', error);
});
