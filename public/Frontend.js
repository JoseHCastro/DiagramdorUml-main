var baseurl = "http://127.0.0.1:3000/"

//aqui se carga el documento
$(document).ready(function() {
    // Obtener la referencia al elemento contenedor de la lista
    const listaDiagramas = document.getElementById("lista-diagramas");

    // Ocultar el div del diagrama al cargar la página
    $("#myDiagramDiv").hide();
    $("#generarCodigo").show();

    // Mostrar el modal de inicio de sesión al cargar la página
    $("#loginModal").css("display", "block");


    // Cerrar el modal de inicio de sesión cuando se hace clic en el botón de cierre (x)
    $(".close").click(function() {
        $(".modal").css("display", "none");
        // Asegurarse de que ningún modal esté bloqueando la pantalla
        $("body").css("overflow", "auto"); // Vuelve a permitir el scroll si estaba bloqueado
    });


    // Mostrar el modal de registro y ocultar el modal de inicio de sesión al hacer clic en "Regístrate aquí"
    $("#showRegistration").click(function() {
        $("#loginModal").css("display", "none");
        $("#registrationModal").css("display", "block");
        $("body").css("overflow", "hidden");

    });

    // Mostrar el modal de inicio de sesión y ocultar el modal de registro al hacer clic en "Inicia sesión aquí"
    $("#showLogin").click(function() {
        $("#registrationModal").css("display", "none");
        $("#loginModal").css("display", "block");
        $("body").css("overflow", "hidden");
    });
    // $("#Spintboot").click(function()) {
    //     $("#Spintboot").css("display", "none");
    //     $("#Spintboot").css("display", "block");
    // }

    // Enviar el formulario de inicio de sesión
    $("#loginForm").submit(function(event) {
        event.preventDefault();
        // Obtener los valores del formulario de inicio de sesión
        var loginUsername = $("#loginUsername").val();
        var loginPassword = $("#loginPassword").val();
        var userData = {
            username: loginUsername,
            password: loginPassword,
        };
        // Enviar la solicitud AJAX al servidor
        $.ajax({
            url: baseurl + "user/login", // Ruta del endpoint de registro en tu servidor
            type: "POST",
            data: JSON.stringify(userData),
            contentType: "application/json",
            success: function(response) {
                // Procesar la respuesta del servidor en caso de éxito
                localStorage.setItem("token", response.token);
                // Ocultar el modal de inicio de sesión
                $("#loginModal").css("display", "none");
                // Buscar diagramas creados anteriomente por el usuario
                obtenerDiagramas();
                // Mostrar el nuevo modal para crear el diagrama
                $("#crearDiagramaModal").css("display", "block");
            },
            error: function(error) {
                // Procesar errores de la solicitud al servidor
                console.error("Error en el login:", error);
            },
        });
    });

    // Enviar el formulario de registro
    $("#registrationForm").submit(function(event) {
        event.preventDefault();

        // Obtener los valores del formulario de registro
        var username = $("#username").val();
        var email = $("#email").val();
        var password = $("#password").val();
        // Crear un objeto con los datos del usuario a enviar
        var userData = {
            username: username,
            email: email,
            password: password,
        };

        // Enviar la solicitud AJAX al servidor
        $.ajax({
            url: baseurl + "user/registro", // Ruta del endpoint de registro en tu servidor
            type: "POST",
            data: JSON.stringify(userData),
            contentType: "application/json",
            success: function(response) {
                // Procesar la respuesta del servidor en caso de éxito
                console.log("Registro exitoso:", response);
            },
            error: function(error) {
                // Procesar errores de la solicitud al servidor
                console.error("Error en el registro:", error);
            },
        });

        // Aquí puedes realizar la lógica de registro

        // Cerrar el modal de registro
        $("#registrationModal").css("display", "none");
    });

    $("#crearDiagramaBtn").click(function() {
        $.ajax({
            url: "diagrams/generarCode",
            method: "GET",
            success: function(response) {
                var nodedata = [{
                        key: 1,
                        name: "Clase Ejemplo",
                        tipo: "titulo",
                        properties: [{
                                key: 0,
                                name: "owner",
                                type: "String",
                                visibility: "public",
                                tipo: "propiedad",
                            },
                            {
                                key: 1,
                                name: "id",
                                type: "integer",
                                visibility: "public",
                                default: "0",
                                tipo: "propiedad",
                            },
                        ],
                        methods: [{
                                name: "save",
                                parameters: [{ name: "amount", type: "integer" }],
                                visibility: "public",
                            },
                            {
                                name: "load",
                                parameters: [{ name: "amount", type: "integer" }],
                                visibility: "public",
                            },
                        ],
                        color: "0",
                        loc: "12 35.52284749830794",
                    },




                ];
                var linkdata = [

                ];
                // guardar diagrama en la nube
                var diagramData = {
                    copiesArrays: true,
                    copiesArrayObjects: true,
                    linkFromPortIdProperty: "fromPort",
                    linkToPortIdProperty: "toPort",
                    nodeDataArray: nodedata,
                    linkDataArray: linkdata,
                }
                const token = localStorage.getItem("token");
                // Enviar los datos del diagrama al servidor
                $.ajax({
                    url: "diagrams/guardarDiagrama",
                    method: "POST",
                    data: JSON.stringify({
                        diagramData: JSON.stringify(diagramData),
                        roomId: response,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token, // Agregar el token al encabezado de autorización
                    },
                    success: function(response) {
                        console.log(response)
                            // Manejar la respuesta del servidor si es necesario
                        cargarDiagrama(response.data, response._id, response.roomId, response.name);
                    },
                    error: function(error) {
                        // Manejar errores de comunicación con el servidor
                    },
                });
            },
            error: function(error) {
                // Manejar errores de comunicación con el servidor
            },
        });

    });

    // Ingresa a un room a traves de un codigo
    $("#joinDiagramaBtn").click(function() {
        // Obtén el valor del roomId del input correspondiente
        const roomId = $("#roomCode").val();
        const token = localStorage.getItem("token");
        $.ajax({
            url: "diagrams/sala/" + roomId,
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token, // Agregar el token al encabezado de autorización
            },
            success: function(response) {
                cargarDiagrama(
                    response.diagrama.data,
                    response.diagrama._id,
                    roomId,
                    response.diagrama.name);
                console.log(response.tipoUser);
                // Cierra el modal de creación de diagrama
                if (response.tipoUser == 'lector') {
                    myDiagram.isReadOnly = true;
                }

                $("#crearDiagramaModal").modal("hide");
            },
            error: function(error) {
                // Manejar errores de comunicación con el servidor
                console.error(error);
                alert("Ocurrió un error al obtener el diagrama.");
            },
        });
    });


    // add listen when i click an item from list
    $("#lista").on("click", "li", function() {
        var diagrama = $(this).attr("data-diagrama");
        var id = $(this).attr("data-id");
        var room_id = $(this).attr("room-id");
        var name = $(this).attr("name");
        cargarDiagrama(diagrama, id, room_id, name); // Cargar el diagrama de GoJS

        // Realizar la acción deseada, como mostrar el diagrama correspondiente
        //console.log("Mostrar diagrama:", diagrama);
    });

    $("#download").on("click", downloadDiagram);

    $("#guestButton").click(function() {
        $("#myDiagramDiv").hide();
        var roomId = myDiagram.roomId;
        const token = localStorage.getItem("token");
        $.ajax({
            url: `/api/room/${roomId}/users`, // Ruta del endpoint de registro en tu servidor
            type: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token, // Agregar el token al encabezado de autorización
            },
            success: function(response) {
                console.log(response.usernames, response.role)
                document.getElementById("guestList").innerHTML = '';
                response.usernames.forEach((user) => {
                    console.log(user.username);
                    const listItem = document.createElement('li');
                    listItem.textContent = user.username;
                    listItem.dataset.userId = user.id;

                    const expelButton = document.createElement('button');
                    expelButton.textContent = 'Expulsar';
                    expelButton.classList.add('expelButton');
                    expelButton.disabled = response.role != 'anfitrion'; // Deshabilitar el botón si el rol es 'anfitrion'

                    listItem.appendChild(expelButton);

                    const roleSelect = document.createElement('select');
                    roleSelect.value = (user.role != 'anfitrion') ? user.role : '-';
                    roleSelect.classList.add('roleSelect');
                    roleSelect.disabled = response.role != 'anfitrion';

                    const editorOption = document.createElement('option');
                    editorOption.value = 'editor';
                    editorOption.textContent = 'Editor';
                    roleSelect.appendChild(editorOption);

                    const lectorOption = document.createElement('option');
                    lectorOption.value = 'lector';
                    lectorOption.textContent = 'Lector';
                    roleSelect.appendChild(lectorOption);

                    listItem.appendChild(roleSelect);

                    const editButton = document.createElement('button');
                    editButton.textContent = 'Editar';
                    editButton.classList.add('editButton');
                    editButton.disabled = response.role != 'anfitrion';
                    listItem.appendChild(editButton);

                    if (user.role === 'anfitrion') {
                        const banner = document.createElement('span');
                        banner.innerHTML = '¡Es el <span style="font-weight: bold;">anfitrión</span>!';
                        banner.style.color = 'green';
                        listItem.appendChild(banner);
                    } else {
                        const banner = document.createElement('span');
                        banner.innerHTML = '<span style="font-weight: bold;">Invitado</span>';
                        banner.style.color = 'green';
                        listItem.appendChild(banner);
                    }
                    // Obtener el rol del usuario seleccionado (por ejemplo, 'editor')
                    const selectedRole = user.role;

                    // Recorrer las opciones del select y establecer la opción seleccionada
                    for (let i = 0; i < roleSelect.options.length; i++) {
                        const option = roleSelect.options[i];

                        if (option.value === selectedRole) {
                            option.selected = true;
                            break;
                        }
                    }
                    $("#guestList").append(listItem);
                });
            },
            error: function(error) {
                console.error("Error :", error);
            },
        });
        var guestModal = document.getElementById("guestModal");
        guestModal.style.display = "block";
    })


    function getNodeByName(name) {
        for (const node of myDiagram.model.nodeDataArray) {
            if (node.name === name) {
                return node;
            }
        }
    }



    $("#load-button").click(function() {
        const fileInput = document.getElementById("file-input");

        if (fileInput.files.length === 0) {
            alert("Por favor, selecciona un archivo XML.");
            return;
        }

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = function(event) {
            const xmlContent = event.target.result;

            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

            const classes = xmlDoc.getElementsByTagName("UML:Class");
            const nodeDataArray = [];
            const linkDataArray = [];

            Array.from(classes).forEach((umlClass) => {
                const className = umlClass.getAttribute("name") || "vacio";
                const classId = umlClass.getAttribute("xmi.id") || "vacio";

                const properties = [];
                const attributes = umlClass.getElementsByTagName("UML:Attribute");

                Array.from(attributes).forEach((attribute, index) => {
                    const attributeName = attribute.getAttribute("name") || "vacio";
                    let attributeType = "vacio";

                    const taggedValues = attribute.getElementsByTagName("UML:TaggedValue");
                    Array.from(taggedValues).forEach((tag) => {
                        if (tag.getAttribute("tag") === "type") {
                            attributeType = tag.getAttribute("value") || "vacio";
                        }
                    });

                    properties.push({
                        key: index,
                        name: attributeName,
                        type: attributeType,
                        visibility: "public",
                        tipo: "propiedad",
                    });
                });

                const methods = [];
                const operations = umlClass.getElementsByTagName("UML:Operation");
                Array.from(operations).forEach((operation, index) => {
                    const methodName = operation.getAttribute("name") || "vacio";
                    const parameters = [];

                    const params = operation.getElementsByTagName("UML:Parameter");
                    Array.from(params).forEach((param) => {
                        if (param.getAttribute("kind") !== "return") {
                            const paramName = param.getAttribute("name") || "vacio";
                            const paramType = param.getElementsByTagName("UML:Classifier")[0].getAttribute("xmi.idref") || "vacio";
                            parameters.push({ name: paramName, type: paramType });
                        }
                    });

                    methods.push({
                        name: methodName,
                        parameters: parameters,
                        visibility: "public",
                    });
                });

                nodeDataArray.push({
                    key: classId,
                    name: className,
                    properties: properties,
                    methods: methods,
                    color: "0",
                    loc: "12 35.52284749830794",
                });
            });

            // Detectar relaciones UML
            const associations = xmlDoc.getElementsByTagName("UML:Association");
            Array.from(associations).forEach((association) => {
                const fromClass = association.getElementsByTagName("UML:AssociationEnd")[0].getAttribute("type");
                const toClass = association.getElementsByTagName("UML:AssociationEnd")[1].getAttribute("type");

                const multiplicityFrom = association.getElementsByTagName("UML:AssociationEnd")[0].getAttribute("multiplicity") || "1";
                const multiplicityTo = association.getElementsByTagName("UML:AssociationEnd")[1].getAttribute("multiplicity") || "1";

                let relationshipType = "association"; // Valor por defecto

                const aggregation = association.getElementsByTagName("UML:AssociationEnd")[1].getAttribute("aggregation");
                if (aggregation === "shared") {
                    relationshipType = "aggregation";
                } else if (aggregation === "composite") {
                    relationshipType = "composition";
                } else {
                    const associationType = association.getAttribute("ea_type") || "";
                    if (associationType === "Generalization") {
                        relationshipType = "generalization";
                    } else if (associationType === "Dependency") {
                        relationshipType = "dependency";
                    }
                }

                const comment = association.getElementsByTagName("UML:TaggedValue")[0].getAttribute("value") || "sin comentario";

                linkDataArray.push({
                    from: fromClass,
                    to: toClass,
                    relationship: relationshipType,
                    multiplicityFrom: multiplicityFrom,
                    multiplicityTo: multiplicityTo,
                    comment: comment,
                });
            });

            // Procesar dependencias UML
            const dependencies = xmlDoc.getElementsByTagName("UML:Dependency");
            Array.from(dependencies).forEach((dependency) => {
                const fromClass = dependency.getAttribute("client");
                const toClass = dependency.getAttribute("supplier");

                linkDataArray.push({
                    from: fromClass,
                    to: toClass,
                    relationship: "dependency",
                    multiplicityFrom: "1",
                    multiplicityTo: "1",
                    comment: "Dependencia",
                });
            });

            // Procesar generalizaciones UML
            const generalizations = xmlDoc.getElementsByTagName("UML:Generalization");
            Array.from(generalizations).forEach((generalization) => {
                const fromClass = generalization.getAttribute("subtype");
                const toClass = generalization.getAttribute("supertype");

                linkDataArray.push({
                    from: fromClass,
                    to: toClass,
                    relationship: "generalization",
                    multiplicityFrom: "1",
                    multiplicityTo: "1",
                    comment: "Generalización",
                });
            });

            console.log("Nodos cargados:", nodeDataArray);
            console.log("Enlaces cargados:", linkDataArray);

            const diagramData = {
                copiesArrays: true,
                copiesArrayObjects: true,
                linkFromPortIdProperty: "fromPort",
                linkToPortIdProperty: "toPort",
                nodeDataArray: nodeDataArray,
                linkDataArray: linkDataArray,
            };

            const token = localStorage.getItem("token");

            $.ajax({
                url: "diagrams/generarCode",
                method: "GET",
                success: function(response) {
                    const roomId = response;

                    $.ajax({
                        url: "diagrams/guardarDiagrama",
                        method: "POST",
                        data: JSON.stringify({
                            diagramData: JSON.stringify(diagramData),
                            roomId: roomId,
                        }),
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: "Bearer " + token,
                        },
                        success: function(response) {
                            cargarDiagrama(response.data, response._id, response.roomId, response.name);
                        },
                        error: function(error) {
                            console.error("Error al guardar el diagrama:", error);
                        },
                    });
                },
                error: function(error) {
                    console.error("Error al generar código de sala:", error);
                },
            });
        };

        reader.readAsText(file);
    });






    // Agrega eventos clic a los botones dentro de la lista de invitados
    $("#guestList").click(function(event) {
        var target = event.target;
        // Si se hizo clic en el botón de "Expulsar"
        if (target.classList.contains("expelButton")) {}

        if (target.classList.contains("editButton")) {
            var listItem = target.closest("li");
            var guestId = listItem.dataset.userId;
            var roleSelect = listItem.querySelector(".roleSelect");
            var selectedRole = roleSelect.value;

            // Lógica para el botón de "Editar" con el ID del invitado y el rol seleccionado
            console.log("ID del invitado:", guestId);
            console.log("Rol seleccionado:", selectedRole);
            const token = localStorage.getItem("token");
            $.ajax({
                url: "user/updateRole",
                type: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: "Bearer " + token, // Agregar el token al encabezado de autorización
                },
                data: JSON.stringify({
                    newRole: selectedRole,
                    guestId: guestId
                }),
                success: function(response) {
                    myDiagram.socket.emit('actualizarRolDiagrama', { newRole: response.role, socketId: response.socketId });
                },
                error: function(error) {
                    console.log(error)
                },
            });
            // Lógica para el botón de "Editar"
        }
    });



    $("#downloadImg").click(function() {
        // Genera la imagen del diagrama
        const imageData = myDiagram.makeImageData({ background: "white" });

        // Crea un enlace de descarga
        const link = document.createElement("a");
        link.href = imageData;
        link.download = "diagram.png"; // Nombre de archivo para la descarga

        // Simula un clic en el enlace de descarga
        link.click();
    });

    $("#copyButton").click(function() {
        const textarea = document.createElement("textarea");
        textarea.value = myDiagram.roomId;
        // Agrega el textarea al cuerpo del documento
        document.body.appendChild(textarea);
        // Selecciona el contenido del textarea
        textarea.select();
        // Copia el contenido al portapapeles
        document.execCommand("copy");
        // Remueve el textarea temporal
        document.body.removeChild(textarea);
        // Puedes mostrar una notificación o realizar otras acciones después de copiar el código
        console.log("Código copiado al portapapeles");
        alert("Código copiado");

    });

    $("#addNode").click(function() {
        const key = getNewKey();
        const newdata = {
            key: key,
            name: "Nueva Tabla",
            properties: [
                { name: "atributo", type: "String", visibility: "public" },
            ],
            methods: [{
                name: "metodo",
                parameters: [{ name: "parametro", type: "Currency" }],
                visibility: "public",
            }, ],
            //group: sel.key,
            loc: "400 100",
            color: 0,
        };
        myDiagram.model.addNodeData(newdata);
        myDiagram.commitTransaction("add node");
        const newnode = myDiagram.findNodeForData(newdata);
        myDiagram.select(newnode);
        myDiagram.commandHandler.editTextBlock();
        myDiagram.commandHandler.scrollToPart(newnode);
        const socket = myDiagram.socket;
        if (socket) {
            console.log("socket verificado");
            socket.emit("createNode", {
                room: myDiagram.roomId,
                data: newdata,
            });
        }
    });


    // Agrega un evento clic fuera del modal para cerrarlo
    window.addEventListener("click", function(event) {
        var guestModal = document.getElementById("guestModal");
        if (event.target === guestModal) {
            // Oculta el modal si se hizo clic fuera de él
            guestModal.style.display = "none";
            $("#myDiagramDiv").show();
        }
    });


    ///////////


    function getDiagramAsText() {
        // Obtén el objeto JSON del diagrama
        const diagramData = myDiagram.model.toJson();

        // Retorna el diagrama como una cadena de texto
        return diagramData;
    }
    // Función para descargar el diagrama como archivo JSON
    function downloadDiagram() {



        // Obtén el objeto JSON del diagrama
        const diagramData = myDiagram.model.toJson();
        // Crea un objeto Blob a partir de los datos del diagrama
        const blob = new Blob([diagramData], { type: "application/json" });
        // Genera una URL para el objeto Blob
        const url = window.URL.createObjectURL(blob);
        // Crea un enlace temporal para descargar el archivo
        const downloadLink = document.createElement("a");
        downloadLink.href = url;
        var nameDiagram = document.getElementById("diagram-name");
        var name = nameDiagram.textContent;
        downloadLink.download = `${name}.json`;
        // Simula el clic en el enlace de descarga
        downloadLink.click();
    }

    function enviarDiagramaAChatGPT() {
        if (typeof myDiagram === 'undefined') {
            $('#respuestaGPT').text('Diagrama no definido.');
            console.log('myDiagram no está definido.');
            return;
        }

        // Obtén el objeto JSON del diagrama
        const diagramData = myDiagram.model.toJson();
        console.log('Datos del diagrama:', diagramData);

        $.ajax({
            url: 'http://127.0.0.1:3000/api/chatgpt',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                prompt: diagramData // Enviamos el JSON del diagrama como prompt
            }),
            success: function(response) {
                $('#respuestaGPT').text(response.response);
            },
            error: function() {
                $('#respuestaGPT').text('Error al generar código');
            }
        });
    }


    function cargarDiagrama(diagrama, id, roomId, name) {

        configDiagrama(roomId);
        var nameDiagram = document.getElementById("diagram-name");
        nameDiagram.textContent = name;
        var delay = 1000; // Período de tiempo de inactividad en milisegundos
        var timeoutId;
        nameDiagram.addEventListener("input", function(event) {
            clearTimeout(timeoutId); // Limpiar el temporizador anterior
            timeoutId = setTimeout(function() {
                // Obtén el nuevo nombre del diagrama
                const newName = event.target.textContent.trim();
                // Actualiza el nombre del diagrama en tu sistema o realiza otras acciones necesarias
                console.log("Nuevo nombre del diagrama:", newName);
                // Realiza una llamada a la API para actualizar el nombre del diagrama en tu base de datos
                myDiagram.socket.emit("changeName", {
                    roomId: myDiagram.roomId,
                    newName,
                    id,
                });
            }, delay);
        });

        nameDiagram.addEventListener("keydown", function(event) {
            // Evita que se realicen saltos de línea al presionar Enter
            if (event.keyCode === 13) {
                event.preventDefault();
            }
        });

        // Manejar evento de agregar nuevo nodo recibido del servidor
        myDiagram.socket.on("actualizarName", ({ newName }) => {
            // Agregar el nuevo nodo al diagrama local
            nameDiagram.textContent = newName;
        });

        // Cargar el modelo de diagrama desde el objeto JSON
        if (diagrama != null) {
            myDiagram.model = go.Model.fromJson(diagrama);
        }


        const diagramaDiv = $("<div>")
            .attr("id", "myDiagramDiv")
            .data("diagrama-id", JSON.stringify(id));
        $("#myDiagramDiv").append(diagramaDiv);
        $("#crearDiagramaModal").css("display", "none");
        $("#myDiagramDiv").show();

        // Suscribirse al evento "Changed" del diagrama
        myDiagram.addModelChangedListener(function(evt) {
            if (evt.isTransactionFinished) {
                var diagramData = myDiagram.model.toJson();
                const token = localStorage.getItem("token");
                $.ajax({
                    url: "diagrams/guardar-diagrama",
                    type: "POST",
                    data: JSON.stringify({
                        diagramData: diagramData,
                        id: id,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Bearer " + token, // Agregar el token al encabezado de autorización
                    },
                    success: function(response) {
                        var messageDiv = document.getElementById("messageDiv");
                        messageDiv.textContent = "guardando...";
                        messageDiv.style.display = "block";
                        setTimeout(function() {
                            messageDiv.style.display = "none";
                        }, 3000); // Ocultar después de 3 segundos (ajusta el tiempo según tus necesidades)
                    },
                    error: function(error) {
                        // Manejar los errores si es necesario
                        console.error(error);
                    },
                });
            }
        });

        init();

        const token = localStorage.getItem("token");
        $.ajax({
            url: "user/getUser",
            type: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token, // Agregar el token al encabezado de autorización
            },
            success: function(response) {
                activar(response);
            },
            error: function(error) {
                console.error(error);
            },
        });

    }

    function activar(username) {
        // Captura los eventos de movimiento del mouse y envía las coordenadas al servidor
        document.addEventListener("mousemove", (event) => {
            const { clientX, clientY } = event;
            myDiagram.socket.emit("mouseMove", {
                x: clientX,
                y: clientY,
                roomId: myDiagram.roomId,
                username: username
            });
        });
    }
    // Función para mostrar los diagramas en la lista
    function mostrarDiagramas(diagramas) {
        // Limpiar la lista
        //listaDiagramas.innerHTML = "";

        // Iterar sobre cada diagrama y crear un elemento de lista para cada uno
        diagramas.forEach((diagrama) => {
            agregarElementoLista(
                diagrama.name,
                JSON.stringify(diagrama.data),
                diagrama._id,
                diagrama.roomId
            );
        });
    }

    // Llamada a la API para obtener los diagramas del usuario
    function obtenerDiagramas() {
        const token = localStorage.getItem("token");
        $.ajax({
            url: `/diagrams/`,
            method: "GET",
            headers: {
                Authorization: "Bearer " + token, // Agregar el token al encabezado de autorización
            },
            success: function(response) {
                const diagramas = response.diagramas;
                mostrarDiagramas(diagramas);
            },
            error: function(error) {
                console.error("Error al obtener los diagramas:", error);
            },
        });
    }

    function obtenerDiagramaPorRoomId(roomId) {
        const token = localStorage.getItem("token");
        $.ajax({
            url: `/sala/${roomId}`, // Usar el roomId en la URL
            method: "GET",
            headers: {
                Authorization: "Bearer " + token, // Agregar el token al encabezado de autorización
            },
            success: function(response) {
                const diagrama = response.diagrama; // Ajusta según cómo está estructurada la respuesta
                const tipoUser = response.tipoUser; // Obtener el rol del usuario
                mostrarDiagrama(diagrama, tipoUser); // Función para mostrar el diagrama y el rol del usuario
            },
            error: function(error) {
                console.error("Error al obtener el diagrama:", error);
            },
        });
    }




    function agregarElementoLista(texto, diagrama, id, roomId) {
        var elemento = $("<li>").addClass("list-group-item").text(texto);
        elemento.attr("data-diagrama", diagrama); // Agregar el atributo de datos
        elemento.attr("data-id", id); // Agregar el atributo de datos
        elemento.attr("room-id", roomId); // Agregar el atributo de datos
        elemento.attr("name", texto); // Agregar el atributo de datos
        $("#lista").append(elemento);
    }

    function getNewName(name, index) {
        const count = myDiagram.model.nodeDataArray.slice(index).filter(obj => obj.name === name).length;
        if (count > 1) {
            return `${name}${count-1}`;
        }
        return name
    }


    function extractTableInfo(node, tableInfo) {
        if (
            node &&
            node.type === "create" &&
            node.table &&
            node.create_definitions
        ) {
            const tableName = node.table[0].table;
            console.log(tableName, node);
            var columns = node.create_definitions.map((definition) => [
                definition.column.column,
                definition.definition.dataType,
            ]);
            tableInfo.push({ tableName, columns });
        }

        for (const key in node) {
            if (node.hasOwnProperty(key) && typeof node[key] === "object") {
                extractTableInfo(node[key], tableInfo);
            }
        }
    }

    function extractRelationshipInfo(ast, relationships) {
        ast.ast.forEach((statement) => {
            if (statement.type === 'create' && statement.as === null && statement.create_definitions) {
                // Estructura CREATE TABLE
                const tableName = statement.table[0].table;
                statement.create_definitions.forEach((definition) => {
                    if (definition.resource === 'column' && definition.column && definition.column.column) {
                        const columnName = definition.column.column;
                        if (definition.definition.suffix && definition.definition.suffix.includes('foreign key')) {
                            relationships.push({
                                tableName: tableName,
                                foreignKey: columnName,
                                // Agregar más detalles de la relación si es necesario
                            });
                        }
                    }
                });
            } else if (statement.type === 'alter' && statement.table && statement.expr && statement.expr[0].create_definitions &&
                statement.expr[0].create_definitions.constraint_type == "FOREIGN KEY") {
                // Estructura ALTER TABLE
                const tableName = statement.table[0].table;

                const foreignKey = statement.expr[0].create_definitions;
                const foreignKeyName = foreignKey.constraint;
                const referencedTable = foreignKey.reference_definition.table[0].table;
                const referencedColumn = foreignKey.reference_definition.definition[0].column;

                // Agregar la relación a la lista
                relationships.push({
                    tableName: tableName,
                    foreignKey: foreignKeyName,
                    referencedTable: referencedTable,
                    referencedColumn: referencedColumn,
                });
            }
        });

    }
});