const express = require("express");
const axios = require('axios');
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const bodyParser = require('body-parser');
const diagramRoutes = require('./routes/diagramRoutes');
const userRoutes = require('./routes/userRoutes');
const Diagram = require('./model/diagramModel');
const User = require('./model/userModel');
const jwt = require("jsonwebtoken");
const config = require("./config");
const dotenv = require('dotenv');
const { getChatGPTResponse } = require('./routes/OpenAi');
dotenv.config();
const db = require("./db/db.config.js");

// MongoDB connection
db.once('open', () => {
    console.log('Conexión a MongoDB establecida');
});

// Configuración de archivos estáticos
app.use(express.static("public"));
app.use(express.json());

// Endpoint para solicitar a ChatGPT
app.post('/api/chatgpt', async(req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
        return res.status(400).json({ error: 'Falta el prompt' });
    }
    try {
        const response = await getChatGPTResponse(prompt);
        res.json({ response });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener respuesta de ChatGPT' });
    }
});

// Manejar conexión de sockets en index.js
io.on("connection", (socket) => {
    console.log("Usuario conectado");

    socket.on('joinRoom', async(data) => {
        const { roomId, token } = data;
        try {
            const decodedToken = jwt.verify(token, config.secretKey);
            const userId = decodedToken.id;
            socket.join(roomId);
            Diagram.findOne({ roomId: roomId, user: userId }).then((diagrama) => {
                var role = (diagrama != null) ? 'anfitrion' : 'editor';
                User.updateOne({ _id: userId }, { socketId: socket.id, 'room.roomId': roomId, 'room.role': role }, { new: true })
                    .then(() => {})
                    .catch((error) => {
                        console.error("Error al actualizar el documento:", error);
                    });
            });

        } catch (error) {
            console.error('Error al agregar un nuevo usuario:', error);
        }

    });

    socket.on("nodeMoved", ({ room, data }) => {
        socket.broadcast.to(room).emit("nodeMoved", data);
    });

    socket.on("disconnect", (data) => {
        // Obtén el ID del usuario que se desconectó del socket
        const userId = socket.id;
        // Actualiza el campo `roomId` del usuario a un valor vacío
        User.updateOne({ socketId: userId }, { 'room.roomId': ' ' })
            .then(() => {
                console.log('Usuario desconectado y campo roomId actualizado');
            })
            .catch((error) => {
                console.error('Error al actualizar el campo roomId:', error);
            });
        console.log("Usuario desconectado");
    });

    socket.on("createNode", ({ room, data }) => {
        // Emitir evento a todos los usuarios conectados para agregar el nuevo nodo
        socket.broadcast.to(room).emit("addNode", data);
    });

    socket.on('createDiagram', (diagramData) => {
        // Guardar el diagrama en la base de datos
        const diagram = new Diagram({
            name: diagramData.name,
            data: diagramData.data
        });
        diagram.save((err) => {
            if (err) {
                console.error('Error al guardar el diagrama:', err);
            } else {
                console.log('Diagrama guardado en la base de datos');
            }
        });
    });

    socket.on("linkCreated", function(data) {
        const { fromNodeKey, toNodeKey, roomId, relationship, multiplicityFrom, multiplicityTo, comment, gohashid } = data;

        // Emitir el evento a todos los demás clientes en la misma sala
        socket.broadcast.to(roomId).emit("linkCreated", {
            fromNodeKey,
            toNodeKey,
            relationship,
            multiplicityFrom,
            multiplicityTo,
            comment,
            gohashid
        });
    });


    socket.on("linkTextEdited", function({ roomId, gohashid, multiplicityFrom, multiplicityTo, comment }) {
        // Emitir el evento a todos los clientes conectados en la sala
        socket.broadcast.to(roomId).emit("updateLinkText", { gohashid, multiplicityFrom, multiplicityTo, comment });
    });

    socket.on("linkPropertyChanged", ({ roomId, linkId, property, value }) => {
        // Emite el evento a todos los demás clientes en la misma sala
        socket.broadcast.to(roomId).emit("updateLinkProperty", { linkId, property, value });
    });

    socket.on('agregarPropiedad', ({ roomId, nodeId, propiedad }) => {
        // Actualizar las propiedades del nodo en la base de datos o en la estructura de datos del servidor

        // Emitir el evento a todos los invitados en la misma sala
        socket.broadcast.to(roomId).emit('actualizarPropiedad', { nodeId: nodeId, propiedad: propiedad });
    });

    socket.on('agregarMetodo', ({ roomId, nodeId, method }) => {
        // Actualizar las propiedades del nodo en la base de datos o en la estructura de datos del servidor

        // Emitir el evento a todos los invitados en la misma sala
        socket.broadcast.to(roomId).emit('actualizarMetodos', { nodeId: nodeId, method: method });
    });

    socket.on('deleteAtributo', ({ roomId, nodeId, index }) => {
        // Actualizar las propiedades del nodo en la base de datos o en la estructura de datos del servidor

        // Emitir el evento a todos los invitados en la misma sala
        socket.broadcast.to(roomId).emit('actualizarAtributos', { nodeId: nodeId, index: index });
    });

    socket.on('changeTextEdit', ({ roomId, nodeId, oldValue, newValue, key, node }) => {
        socket.broadcast.to(roomId).emit('actualizarValues', { nodeId: nodeId, oldValue: oldValue, newValue: newValue, key, node });
    });
    socket.on("relationshipUpdated", function({ roomId, linkId, relationship }) {
        // Emitir el evento a todos los demás clientes en la sala para actualizar el tipo de relación
        socket.broadcast.to(roomId).emit("updateRelationship", {
            linkId: linkId,
            relationship: relationship
        });
    });

    socket.on('changeName', ({ roomId, newName, id }) => {
        // Actualiza el documento en la base de datos
        Diagram.updateOne({ _id: id }, { name: newName })
            .then(() => {
                // El documento se ha actualizado exitosamente
                console.log("Documento actualizado");
            })
            .catch((error) => {
                // Ocurrió un error durante la actualización
                console.error("Error al actualizar el documento:", error);
            });
        // Emitir el evento a todos los invitados en la misma sala
        socket.broadcast.to(roomId).emit('actualizarName', { newName });
    });

    socket.on('nodoEliminado', ({ nodoId, roomId, linksToDelete }) => {
        // Envia el mensaje a los demás invitados
        socket.broadcast.to(roomId).emit('eliminarNodo', { nodoId, linksToDelete });
    });

    socket.on("mouseMove", (data) => {
        socket.broadcast.to(data.roomId).emit("guestMouseMove", {
            x: data.x,
            y: data.y,
            username: data.username
        });
    });

    socket.on("enlaceActualizado", ({ linkData, roomId }) => {
        socket.broadcast.to(roomId).emit("actualizarEnlace", { linkData });
    });
    socket.on("valueChangeLink", function({ roomId, id, newValue, tipo }) {
        // Emitir el evento de actualización de propiedades del enlace
        socket.broadcast.to(roomId).emit("actualizarValueEnlace", { id, newValue, tipo });
    });
    socket.on('actualizarRolDiagrama', ({ newRole, socketId }) => {
        socket.to(socketId).emit('actualizarRol', newRole);
    });

    socket.on('nodosEliminados', ({ nodosIds, linksToDelete, roomId }) => {
        socket.broadcast.to(roomId).emit('eliminarNodosYEnlaces', { nodosIds, linksToDelete });
    });
});

// Definir un endpoint para obtener la lista de usuarios de un room
app.get('/api/room/:roomId/users', (req, res) => {
    const authHeader = req.headers.authorization;
    // Verificar si el encabezado está presente y tiene el formato correcto
    if (authHeader && authHeader.startsWith("Bearer ")) {
        // Extraer el token sin la palabra "Bearer"
        const token = authHeader.split(" ")[1];

        // Verificar y decodificar el token para obtener el userId
        try {
            const decodedToken = jwt.verify(token, config.secretKey);
            const userId = decodedToken.id;
            User.findOne({ _id: userId }).then((usuario) => {
                const roomId = req.params.roomId;
                User.find({ 'room.roomId': roomId }).then((users) => {
                    const usernames = users.map((user) => ({
                        username: user.username,
                        role: user.room.role,
                        id: user._id
                    }));
                    if (usernames) {
                        console.log(usernames)
                        res.json({ usernames, role: usuario.room.role });
                    } else {
                        res.json([]);
                    }
                });
            })


        } catch (e) {

        }
    }

});

http.listen(process.env.PORT, () => {
    console.log(`Servidor escuchando en http://127.0.0.1:${process.env.PORT}`);
});

// for allow parser json
app.use(bodyParser.json());

// Configuración de rutas para los diagramas
app.use('/diagrams', diagramRoutes);
app.use('/user', userRoutes);