import type { Paciente, PlanoSemanalConteudo, DiaPlano } from '@/types/dashboard';
import { calculateAge } from './formatters';

const DIAS_SEMANA = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
];

/**
 * Formata os dados do paciente em texto clínico rico para o prompt do Gemini
 */
export function formatPatientProfileForPrompt(paciente: Paciente): string {
  const parts: string[] = [];

  parts.push(`Nome: ${paciente.nome}`);
  if (paciente.data_nascimento) {
    const idade = calculateAge(paciente.data_nascimento);
    parts.push(`Idade: ${idade !== null ? `${idade} anos` : 'Não informada'}`);
  }
  if (paciente.sexo) parts.push(`Sexo: ${paciente.sexo}`);
  if (paciente.peso_inicial) parts.push(`Peso Atual/Inicial: ${paciente.peso_inicial} kg`);
  if (paciente.altura) {
    const altMetros = paciente.altura > 3 ? (paciente.altura / 100).toFixed(2) : paciente.altura;
    parts.push(`Altura: ${altMetros} m`);
  }
  if (paciente.nivel_atividade) {
    parts.push(`Nível de Atividade Física: ${paciente.nivel_atividade}`);
  }
  if (paciente.objetivos && paciente.objetivos.length > 0) {
    parts.push(`Metas e Objetivos: ${paciente.objetivos.join(', ')}`);
  }
  if (paciente.objetivo_texto) {
    parts.push(`Detalhes do Objetivo: ${paciente.objetivo_texto}`);
  }
  if (paciente.patologias && paciente.patologias.length > 0) {
    parts.push(`Patologias / Condições de Saúde: ${paciente.patologias.join(', ')}`);
  }
  if (paciente.restricoes_alimentares && paciente.restricoes_alimentares.length > 0) {
    parts.push(`Restrições Alimentares: ${paciente.restricoes_alimentares.join(', ')}`);
  }
  if (paciente.alergias && paciente.alergias.length > 0) {
    parts.push(`Alergias Alimentares: ${paciente.alergias.join(', ')}`);
  }
  if (paciente.medicamentos) {
    parts.push(`Medicamentos Contínuos: ${paciente.medicamentos}`);
  }
  if (paciente.suplementos) {
    parts.push(`Suplementos em Uso: ${paciente.suplementos}`);
  }
  if (paciente.refeicoes_por_dia) {
    parts.push(`Refeições diárias preferidas: ${paciente.refeicoes_por_dia}`);
  }
  if (paciente.horario_acorda) {
    parts.push(`Horário que acorda: ${paciente.horario_acorda}`);
  }
  if (paciente.horario_dorme) {
    parts.push(`Horário que dorme: ${paciente.horario_dorme}`);
  }
  if (paciente.litros_agua) {
    parts.push(`Ingestão de água: ${paciente.litros_agua} L/dia`);
  }
  if (paciente.atividade_fisica) {
    parts.push(
      `Prática de exercício: Sim (${paciente.atividade_fisica_descricao || 'Não detalhada'})`
    );
  }
  if (paciente.observacoes) {
    parts.push(`Observações da Anamnese: ${paciente.observacoes}`);
  }

  return parts.join('\n');
}

/**
 * Chama a Serverless Function /api/gerar-plano sem expor chaves ao cliente
 */
export async function gerarPlanoComIAApi(paciente: Paciente): Promise<PlanoSemanalConteudo> {
  const dadosDoPaciente = formatPatientProfileForPrompt(paciente);

  // Timeout de 90 segundos
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  try {
    const res = await fetch('/api/gerar-plano', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dados_do_paciente: dadosDoPaciente,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = 'Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?';
      try {
        const errJson = await res.json();
        if (errJson.error) errMsg = errJson.error;
      } catch {
        // fallback
      }
      throw new Error(errMsg);
    }

    const data = await res.json();

    if (!data.plano_semanal || !Array.isArray(data.plano_semanal)) {
      throw new Error('A resposta da IA não contém o formato semanal esperado.');
    }

    return {
      plano_semanal: data.plano_semanal,
      gerado_por_ia: true,
      criado_em: new Date().toISOString(),
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(
        'Tempo limite excedido. Não foi possível gerar o plano com IA no momento. Deseja tentar novamente ou criar um Plano Manual?'
      );
    }
    throw error;
  }
}

/**
 * Cria a estrutura inicial para um plano alimentar semanal manual ou de contingência
 * com base na culinária e rotina brasileira, respeitando as regras do Prompt 6
 */
export function buildDefaultPlanoSemanal(paciente: Paciente): PlanoSemanalConteudo {
  const semLactose =
    paciente.restricoes_alimentares?.some((r) => r.toLowerCase().includes('lactose')) ||
    paciente.alergias?.some((a) => a.toLowerCase().includes('leite'));
  const semGluten =
    paciente.restricoes_alimentares?.some((r) => r.toLowerCase().includes('glúten')) ||
    paciente.alergias?.some((a) => a.toLowerCase().includes('trigo'));

  const leiteStr = semLactose ? 'Leite vegetal ou sem lactose' : 'Leite desnatado';
  const queijoStr = semLactose ? 'Queijo cottage lacfree ou tofu temperado' : 'Queijo minas frescal';
  const paoStr = semGluten ? 'Pão sem glúten ou tapioca' : 'Pão integral 100%';

  const basePorDia: Record<string, DiaPlano['refeicoes']> = {
    'Segunda-feira': {
      cafe_da_manha: [
        `2 fatias de ${paoStr} com 2 ovos mexidos`,
        `1 xícara de café preto ou com ${leiteStr} sem açúcar`,
        '1 fatia média de mamão formosa com 1 colher de semente de chia',
        `30g de ${queijoStr}`,
        '1 copo (200ml) de água com limão',
      ],
      lanche_manha: [
        '1 maçã média com casca',
        '3 castanhas-do-pará',
        '1 copo de água de coco (200ml)',
        '1 colher de sobremesa de sementes de abóbora tostadas',
        'Chá de hortelã ou erva-doce gelado',
      ],
      almoco: [
        'Salada verde farta (alface, rúcula e tomate cereja) com azeite extravirgem',
        '4 colheres de sopa de arroz integral',
        '1 concha média de feijão carioca bem temperado com louro e alho',
        '1 filé de peito de frango grelhado (130g)',
        'Legumes refogados (abobrinha e cenoura ralada)',
      ],
      lanche_tarde: [
        `1 pote de iogurte natural ${semLactose ? 'sem lactose' : 'desnatado'}`,
        '2 colheres de sopa de aveia em flocos finos',
        '1 banana prata fatiada com canela em pó',
        '1 colher de café de mel puro (opcional)',
        '1 copo grande de água (300ml)',
      ],
      jantar: [
        'Prato fundo de sopa de legumes com patinho desfiado e cúrcuma',
        'Salada de folhas verdes com palmito e tomate',
        '1 fatia média de batata-doce cozida ou mandioca',
        '1 ovo pochê ou cozido extra',
        'Chá de camomila ou melissa morno antes de dormir',
      ],
    },
    'Terça-feira': {
      cafe_da_manha: [
        'Cuscuz nordestino com 2 ovos mexidos',
        `1 fatia de ${queijoStr}`,
        `1 xícara de café com ${leiteStr}`,
        '1 laranja fresca em gomos (com o bagaço)',
        '1 copo de água (250ml)',
      ],
      lanche_manha: [
        '1 pera fresca',
        '4 nozes ou castanhas de caju',
        '1 xícara de chá verde ou hibisco',
        'Chips de coco sem açúcar',
        'Água fresca com hortelã',
      ],
      almoco: [
        'Salada colorida de acelga, cenoura ralada e beterraba com limão',
        '4 colheres de sopa de arroz com brócolis',
        '1 concha de feijão preto',
        '1 filé de peixe (tilápia ou pescada) grelhado com ervas finas',
        'Chuchu e vagem no vapor',
      ],
      lanche_tarde: [
        `Crepioca (1 ovo + 2 colheres de goma de tapioca) recheada com ${queijoStr}`,
        '1 tangerina ou mexerica',
        '1 xícara de chá de erva-cidreira',
        '1 colher de sobremesa de linhaça dourada moída',
        'Água mineral (300ml)',
      ],
      jantar: [
        'Omelete de 2 ovos com espinafre, tomate picado e orégano',
        'Salada de alface roxa, pepino e rabanete com azeite de oliva',
        '3 colheres de sopa de purê de mandioquinha ou abóbora cabotiá',
        '1 porção de brócolis cozido ao alho',
        'Chá de capim-santo morno',
      ],
    },
    'Quarta-feira': {
      cafe_da_manha: [
        `Vitamina de 1 copo de ${leiteStr} com 1/2 abacate e 2 colheres de aveia`,
        `1 torrada de ${paoStr} com pasta de amendoim integral`,
        '1 ovo cozido',
        'Café espresso sem açúcar',
        'Água mineral fresca',
      ],
      lanche_manha: [
        '1 fatia de melão ou melancia picada',
        '1 punhado de sementes de girassol tostadas',
        '1 copo de suco verde (couve, limão e gengibre)',
        '2 castanhas-de-caju sem sal',
        'Água fresca',
      ],
      almoco: [
        'Mix de folhas (agrião, alface americana) com azeite e vinagre de maçã',
        '4 colheres de sopa de arroz integral',
        '1 concha de lentilha ou feijão vermelho',
        'Carne moída magra (patinho) refogada com abobrinha em cubos (130g)',
        'Berinjela assada com azeite e alecrim',
      ],
      lanche_tarde: [
        `2 fatias de ${paoStr} com pasta de ricota ou homus`,
        '1 copo de suco de maracujá natural sem açúcar',
        '1 punhado de uvas roxas',
        '1 colher de semente de chia hidratada',
        'Água (300ml)',
      ],
      jantar: [
        'Filé de peito de frango desfiado com legumes salteados na frigideira',
        'Salada de alface crespa, tomate e cenoura baby',
        '2 fatias de abóbora assada com ervas',
        '1 prato pequeno de couve refogada no alho',
        'Chá de melissa ou maracujá',
      ],
    },
    'Quinta-feira': {
      cafe_da_manha: [
        'Mingau de aveia morno feito com água ou leite adequado e canela',
        '1 banana amassada misturada ao mingau',
        '2 ovos cozidos ou mexidos à parte',
        'Café coado fresco sem açúcar',
        '1 copo de água (250ml)',
      ],
      lanche_manha: [
        '1 goiaba vermelha ou kiwi fatiado',
        '5 amêndoas cruas',
        'Chá de hibisco com casca de abacaxi',
        '1 colher de sopa de farelo de aveia',
        'Água fresca',
      ],
      almoco: [
        'Salada de rúcula, tomate e palmito',
        '4 colheres de sopa de arroz branco ou integral com açafrão',
        '1 concha de feijão carioca',
        'Sobrecoxa de frango assada sem pele (130g)',
        'Couve-flor ao vapor gratinada com azeite',
      ],
      lanche_tarde: [
        `Iogurte natural ${semLactose ? 'sem lactose' : 'integral'} batido com morangos frescos`,
        '1 colher de sopa de sementes de chia',
        '1 punhado pequeno de castanhas variadas',
        'Água de coco fresca',
        '1 fatia pequena de queijo branco',
      ],
      jantar: [
        'Hambúrguer caseiro de carne magra (patinho) grelhado no azeite',
        'Salada farta de folhas verdes, pepino e tomate',
        'Purê de abóbora cabotiá com gengibre (3 colheres de sopa)',
        'Abobrinha grelhada com orégano',
        'Chá morno de camomila',
      ],
    },
    'Sexta-feira': {
      cafe_da_manha: [
        `Tapioca média recheada com 2 ovos mexidos e orégano`,
        `1 fatia de ${queijoStr}`,
        '1 fatia de mamão com sementes de linhaça',
        'Café com leite vegetal ou café puro',
        '1 copo de água gelada',
      ],
      lanche_manha: [
        '1 ameixa fresca ou pêssego',
        '3 castanhas-do-pará',
        'Água aromatizada com rodelas de pepino e hortelã',
        '1 colher de sopa de sementes de abóbora',
        'Chá de capim-limão gelado',
      ],
      almoco: [
        'Salada crocante de repolho roxo, cenoura ralada e gergelim',
        '4 colheres de sopa de arroz integral ou purê de mandioca',
        '1 concha de feijão preto ou feijão fradinho',
        'Iscas de carne bovina magra grelhada com cebola roxa e pimentões (120g)',
        'Espinafre refogado no alho',
      ],
      lanche_tarde: [
        `Smoothie de frutas vermelhas com ${leiteStr} e semente de chia`,
        `1 torrada de ${paoStr} com pasta de ovos cozidos`,
        '1 maçã pequena fatiada',
        'Chá mate tostado gelado sem açúcar',
        'Água fresca (300ml)',
      ],
      jantar: [
        'Filé de salmão ou atum selado na frigideira com azeite (120g)',
        'Salada morna de legumes no vapor (brócolis, cenoura e vagem)',
        'Mix de folhas verdes com azeite extravirgem e gotas de limão',
        '3 colheres de sopa de quinoa cozida ou arroz de couve-flor',
        'Chá de hortelã ou melissa',
      ],
    },
    'Sábado': {
      cafe_da_manha: [
        'Panqueca de banana saudável (1 banana + 1 ovo + 2 colheres de aveia)',
        'Canela em pó polvilhada por cima',
        `1 fatia de ${queijoStr}`,
        'Café com leite ou café preto sem açúcar',
        '1 copo de água (250ml)',
      ],
      lanche_manha: [
        '1 cumbuca pequena de salada de frutas da estação',
        '1 colher de sementes de chia hidratadas',
        '4 castanhas de caju sem sal',
        'Água de coco fresca (200ml)',
        'Chá verde com limão',
      ],
      almoco: [
        'Salada tropical (alface americana, manga em cubos e tomate cereja)',
        '4 colheres de sopa de arroz com lentilhas',
        'Peito de frango assado com ervas e alecrim (140g)',
        'Legumes assados no forno (abobrinha, berinjela e cebola)',
        'Água com gás e rodelas de limão siciliano',
      ],
      lanche_tarde: [
        `1 sanduíche natural com ${paoStr}, frango desfiado, cenoura ralada e azeite`,
        '1 copo de suco de acerola ou laranja natural',
        '1 maçã fatiada',
        'Chá de camomila gelado',
        'Água fresca (300ml)',
      ],
      jantar: [
        'Creme nutritivo de abóbora com frango desfiado e cheiro-verde',
        'Salada de rúcula com tomate e azeite',
        '1 ovo cozido picado no creme',
        '1 fatia pequena de pão integral torrado',
        'Chá de erva-doce morno',
      ],
    },
    'Domingo': {
      cafe_da_manha: [
        'Ovos mexidos com tomate e cebolinha picada (2 ovos)',
        `2 fatias de ${paoStr} levemente tostadas`,
        `1 fatia de ${queijoStr}`,
        '1 taça pequena de frutas picadas (mamão e melão)',
        'Café coado aromático sem açúcar',
      ],
      lanche_manha: [
        '1 banana prata com 1 colher de pasta de amendoim',
        '1 copo de água de coco gelada',
        '3 nozes chilenas',
        'Chá de hibisco com maçã',
        'Água fresca (250ml)',
      ],
      almoco: [
        'Salada caprese adaptada (folhas verdes, tomate maduro, queijo magro e manjericão fresco)',
        '4 colheres de sopa de arroz integral à grega',
        '1 concha de feijão carioca',
        'Peixe assado no forno com azeite, pimentões e cebola (140g)',
        'Purê rústico de batata ou mandioquinha',
      ],
      lanche_tarde: [
        `Vitamina de frutas com ${leiteStr}, aveia e sementes de chia`,
        '1 punhado de castanhas variadas',
        '1 kiwi fresco fatiado',
        'Água aromatizada com hortelã e limão',
        'Chá de capim-santo',
      ],
      jantar: [
        'Omelete recheado com legumes variados e queijo magro',
        'Salada mista de folhas verdes com azeite extravirgem',
        'Sopa leve de legumes ou caldo verde saudável',
        '1 porção de abobrinha refogada com tomate',
        'Chá de camomila relaxante antes de dormir',
      ],
    },
  };

  const plano_semanal: DiaPlano[] = DIAS_SEMANA.map((dia) => ({
    dia,
    refeicoes: basePorDia[dia] || basePorDia['Segunda-feira'],
  }));

  return {
    plano_semanal,
    gerado_por_ia: false,
    criado_em: new Date().toISOString(),
  };
}

