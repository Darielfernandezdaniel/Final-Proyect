import * as functions from 'firebase-functions/v1';
import { defineSecret } from 'firebase-functions/params';
import { OpenAI } from 'openai';
import type { CallableContext } from 'firebase-functions/v1/https';

// Define el secreto pero no lo uses fuera del runtime
const openaiApiKey = defineSecret('OPENAI_API_KEY');

export const generateDalleImage = functions
  .runWith({ secrets: [openaiApiKey] }) // Esto permite usar el secreto dentro del runtime
  .https
  .onCall(async (data: { prompt?: string }, context: CallableContext) => {
    if (!context || !context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'La petición requiere autenticación. Por favor, inicia sesión.'
      );
    }

    const prompt = data.prompt;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'El prompt es requerido y debe ser una cadena de texto no vacía.'
      );
    }

    const openai = new OpenAI({
      apiKey: openaiApiKey.value()
    });

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      });

      if (!response.data || response.data.length === 0 || !response.data[0].url) {
        throw new functions.https.HttpsError(
          'internal',
          'La API de DALL-E no devolvió una URL de imagen válida.'
        );
      }

      const imageUrl = response.data[0].url;
      return { imageUrl };

    } catch (error: any) {
      console.error("Error al llamar a la API de DALL-E:", error.message);
      if (error.response?.data?.error) {
        throw new functions.https.HttpsError(
          'internal',
          `Error de DALL-E: ${error.response.data.error.message || error.response.data.error.type}`
        );
      } else {
        throw new functions.https.HttpsError(
          'internal',
          'Ocurrió un error inesperado al generar la imagen.'
        );
      }
    }
});