/**
 * Gemini API Service for Direct Image Processing
 * Processes match result images directly without storage
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI with error handling
let genAI: GoogleGenerativeAI | null = null;
let model: any = null;

try {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
} catch (error) {
  console.warn('Gemini AI initialization failed:', error);
}

/**
 * Interface for extracted match result data
 */
export interface MatchResultData {
  placement: number;
  kills: number;
  placement_points: number;
  kill_points: number;
  total_points: number;
}

/**
 * Process match result image with Gemini AI
 * @param imageFile - The image file to process
 * @returns Promise with extracted match data
 */
export const processMatchImage = async (imageFile: File): Promise<MatchResultData> => {
  try {
    // Check if Gemini is configured
    if (!model || !genAI) {
      throw new Error('Gemini AI não está configurado. Verifique a chave VITE_GEMINI_API_KEY no arquivo .env');
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem válida');
    }

    // Validate file size (max 5MB)
    if (imageFile.size > 5 * 1024 * 1024) {
      throw new Error('Imagem deve ter menos de 5MB');
    }

    // Convert file to base64
    const base64 = await fileToBase64(imageFile);
    
    const imageParts = [{
      inlineData: {
        data: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
        mimeType: imageFile.type,
      },
    }];

    // Optimized prompt for Brazilian e-sports match results
    const prompt = `
Analise esta imagem de resultado de partida de e-sports (Battle Royale).
Extraia APENAS as seguintes informações do resultado final:

- Colocação final (posição de 1 a 20)
- Número de abates/kills
- Pontos de colocação (placement points)
- Pontos de abate (kill points)  
- Pontos totais

IMPORTANTE:
- Se algum valor não estiver visível, use 0
- Colocação deve ser um número de 1 a 20
- Todos os valores devem ser números inteiros
- Responda APENAS em JSON válido, sem texto adicional

Formato de resposta:
{
  "placement": number,
  "kills": number,
  "placement_points": number,
  "kill_points": number,
  "total_points": number
}
`;

    // Generate content with Gemini
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Clean and parse JSON response
    const cleanText = text.replace(/```json|```/g, '').trim();
    const parsedData = JSON.parse(cleanText);
    
    // Validate extracted data
    const validatedData = validateMatchResultData(parsedData);
    
    return validatedData;
    
  } catch (error) {
    console.error('Erro ao processar imagem com Gemini:', error);
    
    if (error instanceof SyntaxError) {
      throw new Error('Falha ao interpretar dados da imagem. Tente uma imagem mais clara.');
    }
    
    if (error.message.includes('API key')) {
      throw new Error('Chave da API Gemini não configurada');
    }
    
    throw new Error(`Erro no processamento: ${error.message}`);
  }
};

/**
 * Convert File to base64 string
 * @param file - File to convert
 * @returns Promise with base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Validate and sanitize extracted match result data
 * @param data - Raw data from Gemini
 * @returns Validated MatchResultData
 */
const validateMatchResultData = (data: any): MatchResultData => {
  // Ensure all required fields exist and are numbers
  const placement = Math.max(1, Math.min(20, parseInt(data.placement) || 1));
  const kills = Math.max(0, parseInt(data.kills) || 0);
  const placement_points = Math.max(0, parseInt(data.placement_points) || 0);
  const kill_points = Math.max(0, parseInt(data.kill_points) || 0);
  
  // Calculate total points if not provided or invalid
  let total_points = parseInt(data.total_points) || 0;
  if (total_points === 0) {
    total_points = placement_points + kill_points;
  }
  
  return {
    placement,
    kills,
    placement_points,
    kill_points,
    total_points: Math.max(0, total_points)
  };
};

/**
 * Check if Gemini API is properly configured
 * @returns boolean indicating if API is ready
 */
export const isGeminiConfigured = (): boolean => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  return !!(apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_GEMINI_API_KEY_HERE' && model);
};

/**
 * Get Gemini API configuration status
 * @returns Object with configuration details
 */
export const getGeminiStatus = async () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const configured = isGeminiConfigured();
  let working = false;
  let error = null;
  
  if (configured && model) {
    try {
      // Test Gemini API with a simple request
      const testResult = await model.generateContent(['Test connection']);
      working = true;
    } catch (testError: any) {
      console.warn('Gemini API test failed:', testError);
      error = testError.message || 'Erro ao testar conexão com Gemini';
      working = false;
    }
  }
  
  return {
    configured,
    working,
    error,
    apiKey: configured ? 'Configurada' : 'Não configurada',
    model: model ? 'Inicializado' : 'Não inicializado',
    ready: !!(genAI && model && working)
  };
};