// Seeder principal de MongoDB (equivalente al antiguo init-db.sql, adaptado a NoSQL).
// Se ejecuta UNA sola vez, cuando el volumen de datos está vacío
// (montado en /docker-entrypoint-initdb.d/).
//
// Colecciones (todas en la BD compartida `officespace`):
//   users    -> auth-service
//   recursos -> catalog-service (catálogo dinámico de recursos)
//   spaces   -> catalog-service (espacios de trabajo; referencian recursos)
//   reservas -> booking-service
//
// NOTA: los passwordHash son hashes bcrypt (cost 10). mongosh no puede ejecutar
// bcrypt, por eso se precargan ya hasheados.

const db = db.getSiblingDB('officespace');

// ============================================================
// 1) USUARIOS (auth-service)
// ============================================================
db.createCollection('users');
db.users.createIndex({ usuario: 1 }, { unique: true });

db.users.insertMany([
  {
    // Password: Admin123
    usuario: 'admin@corporativoalpha.com',
    passwordHash: '$2a$10$upeAxHYUqC9g5rR6qR6evOCOt.uj0foC5qeGMezH8R/iUFMmNBVX.',
    rol: 'ADMINISTRADOR',
    createdAt: new Date(),
  },
  {
    // Password: User123
    usuario: 'carlos.mendez@corporativoalpha.com',
    passwordHash: '$2a$10$HOCn/hZeueBxBicPe6IMY.VAmG4N9bCAXGsR/qNyqCZC21goFl8KC',
    rol: 'COLABORADOR',
    createdAt: new Date(),
  },
  {
    // Password: User123
    usuario: 'ana.torres@corporativoalpha.com',
    passwordHash: '$2a$10$HOCn/hZeueBxBicPe6IMY.VAmG4N9bCAXGsR/qNyqCZC21goFl8KC',
    rol: 'COLABORADOR',
    createdAt: new Date(),
  },
]);

// ============================================================
// 2) RECURSOS (catálogo dinámico) — recursos básicos de una empresa
// ============================================================
db.createCollection('recursos');
db.recursos.createIndex({ codigo: 1 }, { unique: true });

db.recursos.insertMany([
  { codigo: 'REC-PROYECTOR', nombre: 'Proyector', categoria: 'audiovisual', descripcion: 'Proyector HD/4K', activo: true, createdAt: new Date() },
  { codigo: 'REC-MONITOR', nombre: 'Monitor', categoria: 'computo', descripcion: 'Monitor externo', activo: true, createdAt: new Date() },
  { codigo: 'REC-MOUSE', nombre: 'Mouse', categoria: 'computo', descripcion: 'Mouse inalámbrico', activo: true, createdAt: new Date() },
  { codigo: 'REC-TECLADO', nombre: 'Teclado', categoria: 'computo', descripcion: 'Teclado inalámbrico', activo: true, createdAt: new Date() },
  { codigo: 'REC-PANTALLA', nombre: 'Pantalla / TV', categoria: 'audiovisual', descripcion: 'Pantalla para presentaciones', activo: true, createdAt: new Date() },
  { codigo: 'REC-VIDEOCONF', nombre: 'Videoconferencia', categoria: 'audiovisual', descripcion: 'Cámara y micrófono para videollamadas', activo: true, createdAt: new Date() },
  { codigo: 'REC-WIFI', nombre: 'WiFi', categoria: 'conectividad', descripcion: 'Conexión a internet inalámbrica', activo: true, createdAt: new Date() },
  { codigo: 'REC-AIRE', nombre: 'Aire acondicionado', categoria: 'confort', descripcion: 'Climatización', activo: true, createdAt: new Date() },
  { codigo: 'REC-PIZARRON', nombre: 'Pizarrón', categoria: 'mobiliario', descripcion: 'Pizarrón blanco', activo: true, createdAt: new Date() },
  { codigo: 'REC-ENCHUFE', nombre: 'Tomas de corriente', categoria: 'conectividad', descripcion: 'Enchufes disponibles', activo: true, createdAt: new Date() },
]);

// Helper: arma el sub-documento de recurso asignado a un espacio
function rec(codigo, cantidad) {
  const r = db.recursos.findOne({ codigo: codigo });
  return { recursoId: r._id, codigo: r.codigo, nombre: r.nombre, cantidad: cantidad || 1 };
}

// ============================================================
// 3) ESPACIOS (catalog-service) — referencian recursos del catálogo
// ============================================================
db.createCollection('spaces');
db.spaces.createIndex({ codigo: 1 }, { unique: true });
db.spaces.createIndex({ tipo: 1 });
db.spaces.createIndex({ status: 1 });

db.spaces.insertMany([
  {
    codigo: 'ESP-001',
    nombre: 'Sala de Juntas Atlas',
    tipo: 'sala_juntas',
    capacidad: 12,
    recursos: [rec('REC-PROYECTOR', 1), rec('REC-VIDEOCONF', 1), rec('REC-PIZARRON', 1), rec('REC-AIRE', 1), rec('REC-WIFI', 1)],
    ubicacion: { edificio: 'Torre A', piso: 3, numEscritorio: null },
    status: 'alta',
    reservasProgramadas: [],
    createdAt: new Date(),
  },
  {
    codigo: 'ESP-002',
    nombre: 'Escritorio Flex 14',
    tipo: 'escritorio_individual',
    capacidad: 1,
    recursos: [rec('REC-MONITOR', 1), rec('REC-MOUSE', 1), rec('REC-TECLADO', 1), rec('REC-WIFI', 1), rec('REC-ENCHUFE', 2)],
    ubicacion: { edificio: 'Torre A', piso: 2, numEscritorio: 'E-14' },
    status: 'alta',
    reservasProgramadas: [],
    createdAt: new Date(),
  },
  {
    codigo: 'ESP-003',
    nombre: 'Sala de Juntas Nexus',
    tipo: 'sala_juntas',
    capacidad: 20,
    recursos: [rec('REC-PROYECTOR', 1), rec('REC-PANTALLA', 2), rec('REC-VIDEOCONF', 1), rec('REC-AIRE', 1), rec('REC-WIFI', 1)],
    ubicacion: { edificio: 'Torre B', piso: 1, numEscritorio: null },
    status: 'alta',
    reservasProgramadas: [],
    createdAt: new Date(),
  },
]);

// ============================================================
// 4) RESERVAS (booking-service) — colección vacía con índices
// ============================================================
db.createCollection('reservas');
db.reservas.createIndex({ spaceId: 1, fechaInicio: 1, fechaFin: 1 });
db.reservas.createIndex({ userId: 1 });
db.reservas.createIndex({ status: 1 });

// --- Datos de demo: reservas en varios días/espacios/usuarios -------------
// Sirven para mostrar la exportación a Excel/CSV "como el Excel compartido",
// pero generada por el sistema. (Los estados los recalcula la rutina `sync`.)
const _esp = {
  'ESP-001': db.spaces.findOne({ codigo: 'ESP-001' }),
  'ESP-002': db.spaces.findOne({ codigo: 'ESP-002' }),
  'ESP-003': db.spaces.findOne({ codigo: 'ESP-003' }),
};
const _users = ['carlos.mendez@corporativoalpha.com', 'ana.torres@corporativoalpha.com', 'admin@corporativoalpha.com'];
const _DAY = 24 * 60 * 60 * 1000;

// r(offsetDías, horaInicio, duraciónHoras, codigoEspacio, idxUsuario, asistentes, estado)
function _r(off, hora, dur, cod, u, asis, estado) {
  const base = new Date(); base.setHours(0, 0, 0, 0);
  const ini = new Date(base.getTime() + off * _DAY + hora * 3600000);
  const fin = new Date(ini.getTime() + dur * 3600000);
  const sp = _esp[cod];
  return {
    spaceId: sp._id.toString(), spaceCodigo: sp.codigo, spaceNombre: sp.nombre,
    fechaInicio: ini, fechaFin: fin, asistentes: asis,
    userId: 'seed-' + u, usuario: _users[u],
    status: estado || 'programada', createdAt: new Date(),
  };
}

db.reservas.insertMany([
  // --- Historial (días pasados) ---
  _r(-5, 9, 2, 'ESP-001', 0, 6, 'finalizada'),
  _r(-5, 14, 1, 'ESP-002', 1, 1, 'finalizada'),
  _r(-4, 10, 3, 'ESP-003', 2, 15, 'finalizada'),
  _r(-3, 9, 1, 'ESP-001', 1, 4, 'finalizada'),
  _r(-3, 11, 2, 'ESP-002', 0, 1, 'cancelada'),
  _r(-2, 13, 2, 'ESP-001', 2, 8, 'finalizada'),
  _r(-1, 9, 4, 'ESP-003', 0, 20, 'finalizada'),
  _r(-1, 15, 1, 'ESP-002', 1, 1, 'finalizada'),
  // --- Próximos días (programadas) ---
  _r(1, 9, 2, 'ESP-001', 0, 5, 'programada'),
  _r(1, 12, 1, 'ESP-001', 1, 3, 'programada'),
  _r(1, 14, 2, 'ESP-002', 2, 1, 'programada'),
  _r(2, 10, 3, 'ESP-003', 1, 12, 'programada'),
  _r(2, 9, 1, 'ESP-001', 2, 6, 'programada'),
  _r(3, 11, 2, 'ESP-002', 0, 1, 'programada'),
  _r(3, 15, 2, 'ESP-003', 2, 10, 'programada'),
  _r(4, 9, 4, 'ESP-001', 1, 9, 'programada'),
  _r(5, 13, 2, 'ESP-002', 1, 1, 'programada'),
  _r(6, 10, 2, 'ESP-003', 0, 18, 'programada'),
]);

print('>> init-mongo.js: usuarios, recursos, espacios, reservas (con demo) e índices creados.');
