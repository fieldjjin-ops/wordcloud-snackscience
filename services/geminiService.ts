import { GoogleGenAI, Type } from "@google/genai";
import type { Word } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Extracts text from a base64 encoded image.
 * @param base64Image - The base64 encoded image string.
 * @returns A promise that resolves to the extracted text.
 */
export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };
  
  const textPart = {
    text: 'Extract all text from this image. Return only the text content, without any formatting or explanations.',
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
  });

  return response.text;
};

/**
 * Extracts keywords from a block of text.
 * @param text - The text to analyze.
 * @returns A promise that resolves to an array of Word objects.
 */
export const extractKeywordsFromText = async (text: string): Promise<Word[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze the following text from a worksheet. Identify the top 30 most important keywords or concepts. Return the result as a JSON array where each object has a 'text' (the keyword) and a 'value' (a numerical score from 10 to 100 representing its importance). Do not include any explanation, just the JSON array. Text to analyze: "${text}"`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: 'The keyword or concept.',
            },
            value: {
              type: Type.NUMBER,
              description: 'A numerical score from 10 to 100 representing importance.',
            },
          },
          required: ['text', 'value'],
        },
      },
    },
  });

  try {
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    if (Array.isArray(result) && result.every(item => 'text' in item && 'value' in item)) {
        return result as Word[];
    }
    throw new Error('Invalid JSON format received from API.');
  } catch (error) {
    console.error("Failed to parse keywords JSON:", error);
    // Fallback to empty array if parsing fails
    return [];
  }
};
