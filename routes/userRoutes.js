const express = require("express");
const User = require("../model/userModel");
const bcrypt = require("bcrypt");
const router = express.Router();
const saltRounds = 10;
const jwt = require('jsonwebtoken');
const config = require('../config')

// Registrar un nuevo usuario
router.post("/registro", (req, res) => {
  var userData = req.body;

  // Generar el hash del password
  bcrypt.hash(userData.password, saltRounds, function (err, hash) {
    if (err) {
      console.error("Error al generar el hash del password:", err);
      // Manejar el error de generación del hash
      return res.status(500).send("Error en el servidor");
    }

    // Actualizar el objeto userData con el hash del password
    userData.password = hash;

    // Resto de la lógica de registro...
    console.log("Datos recibidos:", userData);
    // Resto de la lógica de registro...

    // Crear una instancia del modelo de usuario
    const newUser = new User(userData);

    // Guardar el nuevo usuario en la base de datos
    newUser
      .save()
      .then(() => {
        console.log("Usuario registrado:", newUser);
        res.status(200).send("Registro exitoso");
      })
      .catch((err) => {
        console.error("Error al guardar el usuario:", err);
        res.status(500).send("Error en el servidor");
      });
  });
});

// Iniciar sesion de un usuario ya registrado
router.post("/login", async function (req, res) {
  const { username, password } = req.body;

  try {
    // Buscar el usuario en la base de datos por nombre de usuario
    const user = await User.findOne({ username });

    // Verificar si el usuario existe y si la contraseña es correcta
    if (!user || !bcrypt.compareSync(password, user.password)) {
      // El usuario no existe o la contraseña es incorrecta
      return res.status(401).send("Nombre de usuario o contraseña incorrectos");
    }
    // Generar el token de autenticación
    const token = jwt.sign({ id: user._id }, config.secretKey, {
      expiresIn: "7d",
    });
    // Inicio de sesión exitoso
    //console.log("Inicio de sesión exitoso:", user);
    return res.status(200).json({ token });
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    return res.status(500).send("Error en el servidor");
  }
});

router.get('/getUser', async function (req, res){
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, config.secretKey);
      const userId = decodedToken.id;
      const user = await User.findOne({ _id:userId });
      res.json(user.username);
    } catch (e) {
      console.log(e)
    }
  }
});
router.post("/updateRole", (req, res)=>{
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decodedToken = jwt.verify(token, config.secretKey);
      const userId = decodedToken.id;
      const guestId = req.body.guestId;
      const newRole = req.body.newRole; // Nuevo rol que se desea asignar al usuario
      console.log(newRole);
      User.findOneAndUpdate({ _id: guestId }, { 'room.role': newRole }, { new: true })
          .then((user) => {
            // Actualización exitosa
            console.log('Rol actualizado correctamente',user.socketId);
            res.send({
              socketId:user.socketId,
              role: newRole
            });

          })
          .catch((error) => {
            // Error al actualizar
            console.error('Error al actualizar el rol:', error);
          });
    }catch (e) {
      console.log(e)
    }
  }
})


module.exports = router;
