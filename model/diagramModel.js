const mongoose = require('mongoose');

// Definir el esquema del diagrama
const diagramSchema = new mongoose.Schema({
  name: String,
  data: Object,
  roomId: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Crear el modelo del diagrama
const Diagram = mongoose.model('Diagram', diagramSchema);

module.exports = Diagram;