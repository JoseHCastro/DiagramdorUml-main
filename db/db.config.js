const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

// Configuración de conexión a MongoDB esta con el correo de rodrigo.centellas1@gmail.com
//api key software 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
mongoose.connect(`mongodb+srv://uml:uml@cluster0.j62yq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;

module.exports = db;