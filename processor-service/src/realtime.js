// Gateway de tiempo real (WebSocket) del processor-service.
//
// Da la sensación "P2P en vivo" de forma SEGURA: el servidor sigue siendo la
// única autoridad; los dispositivos solo reciben notificaciones empujadas.
//   - El handshake se autentica con el MISMO JWT que la API REST.
//   - Cada usuario se une únicamente a SU room (`user:<id>`) → un cliente no puede
//     espiar eventos de otro.
//   - emitToUser() permite que la lógica de transferencia avise al receptor.

const { Server } = require('socket.io');
const { verifyToken } = require('./config/auth');

let io = null;

function initRealtime(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*' }, // demo en LAN; en prod restringir al origen del frontend
  });

  // Middleware de autenticación del socket: exige un JWT válido en el handshake.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('unauthorized'));
      const payload = verifyToken(token);
      socket.userId = Number(payload.sub);
      next();
    } catch {
      next(new Error('invalid_token'));
    }
  });

  io.on('connection', (socket) => {
    // Autorización: solo puedes unirte a TU propia room.
    socket.join(`user:${socket.userId}`);
    console.log(`[processor-service] socket conectado (user ${socket.userId})`);
  });

  return io;
}

// Empuja un evento a todos los dispositivos conectados de un usuario.
function emitToUser(userId, event, payload) {
  if (io) io.to(`user:${userId}`).emit(event, payload);
}

module.exports = { initRealtime, emitToUser };
