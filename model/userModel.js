const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  socketId: String,
  room: {
    roomId: String,
    role: {
      type: String,
      enum: ['anfitrion', 'editor', 'lector'], // Roles posibles
      default: 'lector' // Rol por defecto para los invitados
    }
  }
  // otras propiedades del usuario
});

const User = mongoose.model('User', userSchema);

module.exports = User;