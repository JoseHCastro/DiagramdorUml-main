// OpenAI.js
const axios = require('axios');

// Función para hacer la petición a la API de OpenAI
async function getChatGPTResponse(prompt) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions', {
                model: "gpt-4o", // O el modelo que prefieras
                messages: [{
                        "role": "system",
                        "content": "Eres un programador experto en sprint boot, se te pasara como pront un archivo json donde estara detalladamente la " +
                            " estructura de una base de datos relacional quiero la analises detenidamente y me generes los archivos para hacer un crud en sprint boot, un codigo basico " +
                            "tambien quiero que hagas los archivos necesarios para esto, es decir los modelos (usando el decorador @Data de lombok.Data), repocitorios, controladores y servicios. todo " +
                            "todo esto debe funcionar. no quiero que uses formatos de negritas o cosas por el estilo en cosas no necesarios. debes hacer toda la clase incluido los import que usaras" +
                            "lo que si quiero que organices y me des todo " +
                            "ordenado esto diciendome el titulo del archivo y a que carpeta pertenece. importante no te equivoques en las relaciones. " +
                            "el proyecto se llamara crud para que hagas bien las rutas. tambien usa estas dependencias import jakarta.persistence.*; " +
                            "debes hacer todo lo necesario para que funcione el crud. no asumas que esta hecho nada. lo haras tu desde cero" +
                            "import java.util.Set;"


                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens: 10000,
                temperature: 0.7,
            }, {
                headers: {
                    // Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                },
            }
        );
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error('Error al comunicarse con la API de OpenAI:', error);
        throw new Error('Error al obtener respuesta de OpenAI');
    }
}

module.exports = { getChatGPTResponse };