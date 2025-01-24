const express = require("express");
const Diagram = require("../model/diagramModel");
const User = require('../model/userModel');
const router = express.Router();
const config = require("../config");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');

// Obtener todos los diagramas desde la base de datos
router.get("/", (req, res) => {
    // Obtener el token del encabezado 'Authorization'
    const authHeader = req.headers.authorization;
    // Verificar si el encabezado está presente y tiene el formato correcto
    if (authHeader && authHeader.startsWith("Bearer ")) {
        // Extraer el token sin la palabra "Bearer"
        const token = authHeader.split(" ")[1];
        // Verificar y decodificar el token para obtener el userId
        try {
            const decodedToken = jwt.verify(token, config.secretKey);
            const userId = decodedToken.id;
            Diagram.find({ user: userId })
                .then((diagramas) => {
                    res.status(200).json({ diagramas });
                })
                .catch((error) => {
                    res.status(500).json({ error: "Error al obtener los diagramas " });
                });
        } catch (error) {
            console.error("Error al decodificar el token:", error.message);
        }
    }
});

// generar un codigo de invitacion al diagrama
router.get("/generarCode", (req, res) => {
    var roomId = uuidv4().substring(0, 8);
    res.status(200).json(roomId);
})

// Definir la ruta para guardar el diagrama
router.post("/guardarDiagrama", (req, res) => {
    // Obtener el token del encabezado 'Authorization'
    const authHeader = req.headers.authorization;
    // Verificar si el encabezado está presente y tiene el formato correcto
    if (authHeader && authHeader.startsWith("Bearer ")) {
        // Extraer el token sin la palabra "Bearer"
        const token = authHeader.split(" ")[1];

        // Verificar y decodificar el token para obtener el userId
        try {
            const decodedToken = jwt.verify(token, config.secretKey);
            const userId = decodedToken.id;
            const diagramData = JSON.parse(req.body.diagramData); // Obtener los datos del diagrama enviados desde el cliente
            var roomId = req.body.roomId;
            if (roomId == null) {
                roomId = uuidv4().substring(0, 8);
            }
            // Crear una instancia del modelo Diagrama con los datos recibidos
            const nuevoDiagrama = new Diagram({
                name: "NuevoDiagrama",
                data: diagramData,
                roomId: roomId,
                user: userId,
            });

            // Guardar el diagrama en la base de datos
            nuevoDiagrama
                .save()
                .then((diagrama) => {
                    // Enviar una respuesta exitosa al cliente
                    res.status(200).json(diagrama);
                })
                .catch((error) => {
                    // Manejar errores de guardado en la base de datos
                    console.error(error);
                    res.sendStatus(500);
                });
        } catch (error) {
            console.error("Error al decodificar el token:", error.message);
            // Manejar el error adecuadamente
            // ...
        }
    } else {
        // El encabezado no está presente o no tiene el formato correcto
        console.error("Encabezado de autorización no válido");
        // Manejar el error adecuadamente
        // ...
    }
});

router.post("/guardar-diagrama", function(req, res) {
    var newData = JSON.parse(req.body.diagramData);
    var diagramaId = req.body.id;
    // Actualiza el documento en la base de datos
    Diagram.updateOne({ _id: diagramaId }, { data: newData })
        .then(() => {
            // El documento se ha actualizado exitosamente
            console.log("Documento actualizado");


        })
        .catch((error) => {
            // Ocurrió un error durante la actualización
            console.error("Error al actualizar el documento:", error);
        });
    res.send("Diagrama guardado correctamente");
});

// Ruta para obtener el diagrama de una sala
router.get('/sala/:roomId', async(req, res) => {
    const authHeader = req.headers.authorization;
    // Verificar si el encabezado está presente y tiene el formato correcto
    if (authHeader && authHeader.startsWith("Bearer ")) {
        // Extraer el token sin la palabra "Bearer"
        const token = authHeader.split(" ")[1];
        try {
            const roomId = req.params.roomId;
            const decodedToken = jwt.verify(token, config.secretKey);
            const userId = decodedToken.id;
            const user = await User.findOne({ _id: userId });
            console.log(user.room.role)
                // Buscar el diagrama por roomId
            const diagrama = await Diagram.findOne({ roomId });
            // Verificar si se encontró el diagrama
            if (!diagrama && !user) {
                return res.status(404).json({ message: 'Diagrama no encontrado' });
            }
            // Devolver el diagrama
            res.json({
                diagrama: diagrama,
                tipoUser: user.room.role
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener el diagrama' });
        }
    }
});


module.exports = router;