import { sql } from './neon-auth';
import type {
  DashboardStats,
  Paciente,
  Consulta,
  PacienteSemRetorno,
  CreatePacienteInput,
  PlanoAlimentar,
} from '@/types/dashboard';

/**
 * Carrega em tempo real as métricas dos 3 cards do Dashboard para a nutricionista logada
 */
export async function getDashboardStats(nutricionistaId: string): Promise<DashboardStats> {
  try {
    // Card 1: Total de pacientes cadastrados pela nutricionista logada
    const resTotalPacientes = await sql.query(
      `SELECT COUNT(*)::int AS total FROM public.pacientes WHERE nutricionista_id = $1;`,
      [nutricionistaId]
    );
    const totalPacientesAtivos = resTotalPacientes?.[0]?.total || 0;

    // Card 2: Consultas registradas na semana atual (Segunda a Domingo)
    const resConsultasSemana = await sql.query(
      `SELECT COUNT(*)::int AS total
       FROM public.consultas c
       JOIN public.pacientes p ON c.paciente_id = p.id
       WHERE p.nutricionista_id = $1
         AND c.data_consulta >= date_trunc('week', CURRENT_DATE)
         AND c.data_consulta < date_trunc('week', CURRENT_DATE) + INTERVAL '7 days';`,
      [nutricionistaId]
    );
    const consultasSemana = resConsultasSemana?.[0]?.total || 0;

    // Card 3: Pacientes sem retorno
    // Última consulta há mais de 30 dias E sem próximo retorno agendado (ou retorno já expirado)
    const resPacientesSemRetorno = await sql.query(
      `WITH ultimas_consultas AS (
         SELECT 
           p.id AS paciente_id,
           p.nome AS paciente_nome,
           p.email AS paciente_email,
           p.telefone AS paciente_telefone,
           MAX(c.data_consulta) AS ultima_consulta,
           MAX(c.proximo_retorno) AS proximo_retorno
         FROM public.pacientes p
         JOIN public.consultas c ON c.paciente_id = p.id
         WHERE p.nutricionista_id = $1
         GROUP BY p.id, p.nome, p.email, p.telefone
       )
       SELECT 
         paciente_id,
         paciente_nome,
         paciente_email,
         paciente_telefone,
         to_char(ultima_consulta, 'YYYY-MM-DD') AS ultima_consulta,
         to_char(proximo_retorno, 'YYYY-MM-DD') AS proximo_retorno,
         (CURRENT_DATE - ultima_consulta)::int AS dias_sem_consulta
       FROM ultimas_consultas
       WHERE ultima_consulta < CURRENT_DATE - INTERVAL '30 days'
         AND (proximo_retorno IS NULL OR proximo_retorno < CURRENT_DATE)
       ORDER BY ultima_consulta ASC;`,
      [nutricionistaId]
    );

    const pacientesSemRetorno: PacienteSemRetorno[] = (resPacientesSemRetorno || []).map((row: any) => ({
      paciente_id: row.paciente_id,
      paciente_nome: row.paciente_nome,
      paciente_email: row.paciente_email,
      paciente_telefone: row.paciente_telefone,
      ultima_consulta: row.ultima_consulta,
      proximo_retorno: row.proximo_retorno,
      dias_sem_consulta: Number(row.dias_sem_consulta) || 0,
    }));

    return {
      totalPacientesAtivos,
      consultasSemana,
      pacientesSemRetorno,
    };
  } catch (error) {
    console.error('[NutriOn] Erro ao carregar estatísticas do dashboard:', error);
    return {
      totalPacientesAtivos: 0,
      consultasSemana: 0,
      pacientesSemRetorno: [],
    };
  }
}

/**
 * Busca a lista de pacientes da nutricionista com a data da última consulta
 */
export async function getPacientes(nutricionistaId: string): Promise<Paciente[]> {
  try {
    const rows = await sql.query(
      `SELECT 
         p.*,
         to_char(MAX(c.data_consulta), 'YYYY-MM-DD') AS ultima_consulta,
         COUNT(c.id)::int AS total_consultas
       FROM public.pacientes p
       LEFT JOIN public.consultas c ON c.paciente_id = p.id
       WHERE p.nutricionista_id = $1
       GROUP BY p.id
       ORDER BY p.nome ASC;`,
      [nutricionistaId]
    );
    return (rows as Paciente[]) || [];
  } catch (error) {
    console.error('[NutriOn] Erro ao buscar pacientes:', error);
    return [];
  }
}

/**
 * Busca perfil detalhado de um paciente e seu histórico de consultas
 */
export async function getPacienteProfile(
  pacienteId: string,
  nutricionistaId: string
): Promise<{ paciente: Paciente; consultas: Consulta[] } | null> {
  try {
    const pacienteRows = await sql.query(
      `SELECT * FROM public.pacientes WHERE id = $1 AND nutricionista_id = $2 LIMIT 1;`,
      [pacienteId, nutricionistaId]
    );

    if (!pacienteRows || pacienteRows.length === 0) {
      return null;
    }

    const consultasRows = await sql.query(
      `SELECT id, paciente_id, to_char(data_consulta, 'YYYY-MM-DD') AS data_consulta,
              peso, cintura, quadril, percentual_gordura, observacoes,
              to_char(proximo_retorno, 'YYYY-MM-DD') AS proximo_retorno, created_at
       FROM public.consultas
       WHERE paciente_id = $1
       ORDER BY data_consulta DESC, created_at DESC;`,
      [pacienteId]
    );

    return {
      paciente: pacienteRows[0] as Paciente,
      consultas: (consultasRows as Consulta[]) || [],
    };
  } catch (error) {
    console.error('[NutriOn] Erro ao buscar dados completos do paciente:', error);
    return null;
  }
}

/**
 * Cria um novo paciente para a nutricionista logada no Neon
 * com todos os campos clínicos, pessoais e hábitos (Prompt 4)
 */
export async function createPaciente(
  nutricionistaId: string,
  dados: CreatePacienteInput
): Promise<Paciente | null> {
  try {
    const rows = await sql.query(
      `INSERT INTO public.pacientes (
         nutricionista_id, nome, email, telefone, whatsapp,
         data_nascimento, sexo, peso_inicial, altura,
         objetivos, objetivo_texto, nivel_atividade,
         patologias, restricoes_alimentares, alergias,
         medicamentos, suplementos, refeicoes_por_dia,
         horario_acorda, horario_dorme, litros_agua,
         atividade_fisica, atividade_fisica_descricao, observacoes
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9,
         $10, $11, $12,
         $13, $14, $15,
         $16, $17, $18,
         $19, $20, $21,
         $22, $23, $24
       ) RETURNING *;`,
      [
        nutricionistaId,
        dados.nome.trim(),
        dados.email?.trim().toLowerCase() || null,
        dados.telefone?.trim() || null,
        dados.whatsapp?.trim() || null,
        dados.data_nascimento || null,
        dados.sexo || null,
        dados.peso_inicial != null && !isNaN(dados.peso_inicial) ? dados.peso_inicial : null,
        dados.altura != null && !isNaN(dados.altura) ? dados.altura : null,
        dados.objetivos && dados.objetivos.length > 0 ? dados.objetivos : null,
        dados.objetivo_texto?.trim() || null,
        dados.nivel_atividade || null,
        dados.patologias && dados.patologias.length > 0 ? dados.patologias : null,
        dados.restricoes_alimentares && dados.restricoes_alimentares.length > 0 ? dados.restricoes_alimentares : null,
        dados.alergias && dados.alergias.length > 0 ? dados.alergias : null,
        dados.medicamentos?.trim() || null,
        dados.suplementos?.trim() || null,
        dados.refeicoes_por_dia != null && !isNaN(dados.refeicoes_por_dia) ? dados.refeicoes_por_dia : null,
        dados.horario_acorda?.trim() || null,
        dados.horario_dorme?.trim() || null,
        dados.litros_agua != null && !isNaN(dados.litros_agua) ? dados.litros_agua : null,
        typeof dados.atividade_fisica === 'boolean' ? dados.atividade_fisica : null,
        dados.atividade_fisica_descricao?.trim() || null,
        dados.observacoes?.trim() || null,
      ]
    );

    const novoPaciente = (rows?.[0] as Paciente) || null;

    // Regra: "Preciso que ao cadastrar o Paciente eu possa colocar a data de início do tratamento, essa data ficará registrada como a primeira consulta"
    if (novoPaciente && dados.data_inicio_tratamento) {
      try {
        await createConsulta(novoPaciente.id, {
          data_consulta: dados.data_inicio_tratamento,
          peso: dados.peso_inicial != null && !isNaN(dados.peso_inicial) ? dados.peso_inicial : undefined,
          observacoes: 'Início do tratamento nutricional',
        });
      } catch (err) {
        console.warn('[NutriOn] Erro ao registrar consulta inicial do paciente:', err);
      }
    }

    return novoPaciente;
  } catch (error) {
    console.error('[NutriOn] Erro ao cadastrar paciente:', error);
    throw error;
  }
}

/**
 * Atualiza os dados de um paciente existente no Neon
 */
export async function updatePaciente(
  pacienteId: string,
  dados: Partial<CreatePacienteInput>
): Promise<Paciente | null> {
  try {
    const rows = await sql.query(
      `UPDATE public.pacientes SET
         nome = COALESCE($2, nome),
         email = $3,
         telefone = $4,
         whatsapp = $5,
         data_nascimento = $6,
         sexo = $7,
         peso_inicial = $8,
         altura = $9,
         objetivos = $10,
         objetivo_texto = $11,
         nivel_atividade = $12,
         patologias = $13,
         restricoes_alimentares = $14,
         alergias = $15,
         medicamentos = $16,
         suplementos = $17,
         refeicoes_por_dia = $18,
         horario_acorda = $19,
         horario_dorme = $20,
         litros_agua = $21,
         atividade_fisica = $22,
         atividade_fisica_descricao = $23,
         observacoes = $24
       WHERE id = $1
       RETURNING *;`,
      [
        pacienteId,
        dados.nome?.trim() || null,
        dados.email ? dados.email.trim().toLowerCase() : null,
        dados.telefone?.trim() || null,
        dados.whatsapp?.trim() || null,
        dados.data_nascimento || null,
        dados.sexo || null,
        dados.peso_inicial != null && !isNaN(dados.peso_inicial) ? dados.peso_inicial : null,
        dados.altura != null && !isNaN(dados.altura) ? dados.altura : null,
        dados.objetivos && dados.objetivos.length > 0 ? dados.objetivos : null,
        dados.objetivo_texto?.trim() || null,
        dados.nivel_atividade || null,
        dados.patologias && dados.patologias.length > 0 ? dados.patologias : null,
        dados.restricoes_alimentares && dados.restricoes_alimentares.length > 0 ? dados.restricoes_alimentares : null,
        dados.alergias && dados.alergias.length > 0 ? dados.alergias : null,
        dados.medicamentos?.trim() || null,
        dados.suplementos?.trim() || null,
        dados.refeicoes_por_dia != null && !isNaN(dados.refeicoes_por_dia) ? dados.refeicoes_por_dia : null,
        dados.horario_acorda?.trim() || null,
        dados.horario_dorme?.trim() || null,
        dados.litros_agua != null && !isNaN(dados.litros_agua) ? dados.litros_agua : null,
        typeof dados.atividade_fisica === 'boolean' ? dados.atividade_fisica : null,
        dados.atividade_fisica_descricao?.trim() || null,
        dados.observacoes?.trim() || null,
      ]
    );

    return (rows?.[0] as Paciente) || null;
  } catch (error) {
    console.error('[NutriOn] Erro ao atualizar paciente:', error);
    throw error;
  }
}

/**
 * Busca o histórico de planos alimentares salvos para o paciente no Neon
 */
export async function getPlanosAlimentares(pacienteId: string): Promise<PlanoAlimentar[]> {
  try {
    const rows = await sql.query(
      `SELECT id, paciente_id, conteudo, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
       FROM public.planos_alimentares
       WHERE paciente_id = $1
       ORDER BY created_at DESC;`,
      [pacienteId]
    );
    return (rows as PlanoAlimentar[]) || [];
  } catch (error) {
    console.error('[NutriOn] Erro ao buscar planos alimentares:', error);
    return [];
  }
}

/**
 * Salva um novo plano alimentar para o paciente no Neon
 */
export async function savePlanoAlimentar(
  pacienteId: string,
  conteudo: any
): Promise<PlanoAlimentar | null> {
  try {
    const jsonStr = typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo);
    const rows = await sql.query(
      `INSERT INTO public.planos_alimentares (paciente_id, conteudo)
       VALUES ($1, $2::jsonb)
       RETURNING id, paciente_id, conteudo, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at;`,
      [pacienteId, jsonStr]
    );
    return (rows?.[0] as PlanoAlimentar) || null;
  } catch (error) {
    console.error('[NutriOn] Erro ao salvar plano alimentar:', error);
    throw error;
  }
}

/**
 * Exclui um plano alimentar pelo ID
 */
export async function deletePlanoAlimentar(planoId: string): Promise<boolean> {
  try {
    await sql.query(`DELETE FROM public.planos_alimentares WHERE id = $1;`, [planoId]);
    return true;
  } catch (error) {
    console.error('[NutriOn] Erro ao excluir plano alimentar:', error);
    return false;
  }
}

/**
 * Registra uma nova consulta para o paciente
 */
export async function createConsulta(
  pacienteId: string,
  dados: {
    data_consulta: string;
    peso?: number;
    cintura?: number;
    quadril?: number;
    percentual_gordura?: number;
    observacoes?: string;
    proximo_retorno?: string;
  }
): Promise<Consulta | null> {
  try {
    const rows = await sql.query(
      `INSERT INTO public.consultas (
         paciente_id, data_consulta, peso, cintura, quadril,
         percentual_gordura, observacoes, proximo_retorno
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        pacienteId,
        dados.data_consulta,
        dados.peso != null && !isNaN(dados.peso) ? dados.peso : null,
        dados.cintura != null && !isNaN(dados.cintura) ? dados.cintura : null,
        dados.quadril != null && !isNaN(dados.quadril) ? dados.quadril : null,
        dados.percentual_gordura != null && !isNaN(dados.percentual_gordura) ? dados.percentual_gordura : null,
        dados.observacoes?.trim() || null,
        dados.proximo_retorno || null,
      ]
    );

    return (rows?.[0] as Consulta) || null;
  } catch (error) {
    console.error('[NutriOn] Erro ao registrar consulta:', error);
    throw error;
  }
}

/**
 * Insere dados de demonstração no Neon para demonstrar e testar todos os 3 cards do dashboard
 */
export async function seedDemoData(nutricionistaId: string): Promise<boolean> {
  try {
    // 1. Paciente com última consulta há 42 dias sem retorno agendado (aparece no Card 3: Pacientes sem retorno)
    const p1Rows = await sql.query(
      `INSERT INTO public.pacientes (
         nutricionista_id, nome, email, telefone, whatsapp,
         data_nascimento, sexo, peso_inicial, altura, objetivo_texto, observacoes
       ) VALUES (
         $1, 'Mariana Alencar Ribeiro', 'mariana.alencar@exemplo.com', '(11) 98765-4321', '(11) 98765-4321',
         '1994-06-15', 'Feminino', 72.5, 1.68, 'Emagrecimento saudável e reeducação alimentar',
         'Paciente sem retorno há mais de um mês, necessita de reavaliação alimentar.'
       ) RETURNING id;`,
      [nutricionistaId]
    );
    const p1Id = p1Rows?.[0]?.id;

    if (p1Id) {
      // Consulta há 42 dias sem retorno
      await sql.query(
        `INSERT INTO public.consultas (
           paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura,
           observacoes, proximo_retorno
         ) VALUES (
           $1, CURRENT_DATE - INTERVAL '42 days', 72.5, 78.0, 102.0, 28.5,
           'Primeira consulta e plano alimentar inicial prescrito.', NULL
         );`,
        [p1Id]
      );
    }

    // 2. Paciente com consulta realizada na semana atual (aparece no Card 2: Consultas da semana)
    const p2Rows = await sql.query(
      `INSERT INTO public.pacientes (
         nutricionista_id, nome, email, telefone, whatsapp,
         data_nascimento, sexo, peso_inicial, altura, objetivo_texto, observacoes
       ) VALUES (
         $1, 'Lucas Fernandes Rocha', 'lucas.fernandes@exemplo.com', '(11) 99123-8877', '(11) 99123-8877',
         '1989-11-20', 'Masculino', 84.0, 1.82, 'Hipertrofia muscular e ganho de massa magra',
         'Pratica musculação 5x na semana.'
       ) RETURNING id;`,
      [nutricionistaId]
    );
    const p2Id = p2Rows?.[0]?.id;

    if (p2Id) {
      // Consulta nesta semana
      await sql.query(
        `INSERT INTO public.consultas (
           paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura,
           observacoes, proximo_retorno
         ) VALUES (
           $1, CURRENT_DATE, 82.8, 83.0, 99.0, 15.2,
           'Evolução excelente de composição corporal. Ajuste na ingestão de carboidratos complexos.',
           CURRENT_DATE + INTERVAL '28 days'
         );`,
        [p2Id]
      );
    }

    // 3. Paciente ativo com retorno agendado em dia (aparece no Card 1: Total de pacientes)
    const p3Rows = await sql.query(
      `INSERT INTO public.pacientes (
         nutricionista_id, nome, email, telefone, whatsapp,
         data_nascimento, sexo, peso_inicial, altura, objetivo_texto, observacoes
       ) VALUES (
         $1, 'Camila Silveira Santos', 'camila.nutri@exemplo.com', '(21) 97654-1122', '(21) 97654-1122',
         '1998-03-08', 'Feminino', 61.0, 1.63, 'Melhora na disposição e controle de colesterol',
         'Rotina corrida de trabalho, foco em refeições práticas.'
       ) RETURNING id;`,
      [nutricionistaId]
    );
    const p3Id = p3Rows?.[0]?.id;

    if (p3Id) {
      await sql.query(
        `INSERT INTO public.consultas (
           paciente_id, data_consulta, peso, cintura, quadril, percentual_gordura,
           observacoes, proximo_retorno
         ) VALUES (
           $1, CURRENT_DATE - INTERVAL '12 days', 61.0, 71.0, 95.0, 24.0,
           'Acompanhamento regular. Próxima consulta já agendada.',
           CURRENT_DATE + INTERVAL '18 days'
         );`,
        [p3Id]
      );
    }

    return true;
  } catch (error) {
    console.error('[NutriOn] Erro ao gerar dados de demonstração:', error);
    return false;
  }
}
