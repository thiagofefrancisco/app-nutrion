import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'node:fs';

/**
 * Lê a GEMINI_API_KEY com segurança estritamente no lado do servidor
 */
function getGeminiApiKey(): string | undefined {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY.trim();
  }
  try {
    if (fs.existsSync('.env')) {
      const content = fs.readFileSync('.env', 'utf-8');
      const match = content.match(/GEMINI_API_KEY=(.+)/);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch (err) {
    console.warn('[NutriOn API] Não foi possível ler .env no servidor:', err);
  }
  return undefined;
}

/**
 * Monta o prompt clínico estruturado conforme especificado no Prompt 6
 */
export function buildPrompt(dadosDoPaciente: string): string {
  return `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dadosDoPaciente}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;
}

/**
 * Executa a chamada à IA com modelo primário e fallbacks resilientes
 */
export async function gerarPlanoComIA(dadosDoPaciente: string) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não foi configurada no ambiente do servidor.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const prompt = buildPrompt(dadosDoPaciente);

  // Modelos ordenados por velocidade e disponibilidade com fallback resiliente para picos de alta demanda (503)
  const candidateModels = [
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-flash-lite-latest',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-flash-latest',
  ];

  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      // Timeout individual por modelo (25 segundos) para tentar o próximo caso fique travado
      const modelPromise = model.generateContent(prompt);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Tempo limite de 25s excedido para ${modelName}`)), 25000)
      );

      const result = await Promise.race([modelPromise, timeoutPromise]);
      const rawText = result.response.text();

      if (!rawText) {
        throw new Error('Resposta vazia da API do Gemini.');
      }

      // Limpeza de possíveis blocos markdown acidentais
      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsed = JSON.parse(cleaned);

      if (!parsed.plano_semanal || !Array.isArray(parsed.plano_semanal)) {
        throw new Error('O JSON retornado pela IA não contém a estrutura "plano_semanal".');
      }

      return {
        ...parsed,
        gerado_por_ia: true,
        modelo_utilizado: modelName,
      };
    } catch (err: any) {
      console.warn(`[NutriOn API] Tentativa com modelo ${modelName} falhou:`, err.message || err);
      lastError = err;
      // Se for erro de autenticação ou argumento inválido, não adianta tentar outros modelos
      if (err.status === 400 || err.status === 401 || err.status === 403) {
        break;
      }
    }
  }

  throw lastError || new Error('Não foi possível gerar o plano alimentar com o Gemini no momento.');
}

/**
 * Handler compatível com Serverless Functions (Vercel / Node)
 */
export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
    return;
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const dadosDoPaciente = body.dados_do_paciente || body.dadosDoPaciente;

    if (!dadosDoPaciente || typeof dadosDoPaciente !== 'string' || !dadosDoPaciente.trim()) {
      res.status(400).json({
        error: 'O parâmetro "dados_do_paciente" é obrigatório e deve ser uma string com os dados do paciente.',
      });
      return;
    }

    const plano = await gerarPlanoComIA(dadosDoPaciente);
    res.status(200).json(plano);
  } catch (error: any) {
    console.error('[NutriOn API] Erro ao gerar plano alimentar:', error);
    res.status(500).json({
      error: 'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?',
      details: error.message || String(error),
    });
  }
}

