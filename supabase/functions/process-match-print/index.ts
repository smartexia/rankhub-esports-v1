import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables.');
  Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

serve(async (req) => {
  const { record } = await req.json();
  const { id, file_path } = record;

  try {
    await supabase.from('match_prints').update({ status: 'processing' }).eq('id', id);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('match-prints')
      .download(file_path);

    if (downloadError) {
      throw downloadError;
    }

    const image_parts = [
      {
        inline_data: {
          data: btoa(await fileData.text()),
          mime_type: fileData.type,
        },
      },
    ];

    const prompt = `
      Analise a imagem do resultado de uma partida de e-sports.
      Extraia as seguintes informações:
      - Colocação final da equipe (ex: 1st, 2nd, 3rd)
      - Número de abates (kills) da equipe
      - Pontos de colocação
      - Pontos de abate
      - Pontos totais

      Responda em formato JSON com as seguintes chaves:
      "placement" (number), "kills" (number), "placement_points" (number), "kill_points" (number), "total_points" (number).
      Se uma informação não for encontrada, retorne null para a chave correspondente.
    `;

    const result = await model.generateContent([prompt, ...image_parts]);
    const response = await result.response;
    const text = response.text();

    const extracted_data = JSON.parse(text.replace(/```json|```/g, '').trim());

    await supabase
      .from('match_prints')
      .update({
        status: 'processed',
        extracted_data: extracted_data,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing match print:', error);
    await supabase
      .from('match_prints')
      .update({
        status: 'error',
        error_message: error.message,
        processed_at: new Date().toISOString(),
      })
      .eq('id', id);

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});