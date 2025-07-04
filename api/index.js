const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

module.exports = async (req, res) => {
  // Configurar encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  if (!DEEPSEEK_API_KEY) {
    return res.status(500).json({ error: 'DEEPSEEK_API_KEY no está definida' });
  }

  const { prompt, stream = false } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "El campo 'prompt' es requerido." });
  }

  try {
    // Configuración para streaming
    if (stream) {
      // Configuramos los headers para streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const response = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content: `
                Tu nombre es Cloe. 
                Eres el asistente virtual de la empresa Imelec Electricidad.
                Te enviaran preguntas y dudas tecnicas referente a instalaciones electricas, deberas responder basandote en el reglamento electrotécnico de baja tensión (REBT) de España cuando sean preguntas tecnicas.
                El telefono de Imelec es el numero +34 691 50 23 61 y su correo es info@imelec.es
                tu tarea es responder a lo que te preguntan o brindarles la informacion necesaria. 
                Si fuera necesario la intervencion de un electricista, 
                siempre tienes que ofrecer el servicio de Imelec Electricidad 
              `
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          stream: true // Habilitamos streaming en la API
        },
        {
          headers: {
            Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream' // Importante para manejar la respuesta como stream
        }
      );

      // Pipe la respuesta de DeepSeek directamente al cliente
      response.data.pipe(res);

      return;
    }

    // Código original para respuestas no streaming
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `
              Tu nombre es Cloe. 
              Eres el asistente virtual de la empresa Imelec Electricidad.
              Te enviaran preguntas y dudas tecnicas referente a instalaciones electricas, deberas responder basandote en el reglamento electrotécnico de baja tensión (REBT) de España cuando sean preguntas tecnicas.
              El telefono de Imelec es el numero +34 691 50 23 61 y su correo es info@imelec.es
              tu tarea es responder a lo que te preguntan o brindarles la informacion necesaria. 
              Si fuera necesario la intervencion de un electricista, 
              siempre tienes que ofrecer el servicio de Imelec Electricidad 
            `
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('Error al llamar a DeepSeek:', error.response?.data || error.message);
    res.status(500).json({
      error: "Error al procesar la solicitud",
      details: error.response?.data || error.message,
    });
  }
};