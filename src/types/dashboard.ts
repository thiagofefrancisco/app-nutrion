export interface Paciente {
  id: string;
  nutricionista_id: string;
  nome: string;
  data_nascimento?: string | Date | null;
  sexo?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  peso_inicial?: number | null;
  altura?: number | null;
  objetivos?: string[] | null;
  objetivo_texto?: string | null;
  nivel_atividade?: string | null;
  patologias?: string[] | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string[] | null;
  medicamentos?: string | null;
  suplementos?: string | null;
  refeicoes_por_dia?: number | null;
  horario_acorda?: string | null;
  horario_dorme?: string | null;
  litros_agua?: number | null;
  atividade_fisica?: boolean | null;
  atividade_fisica_descricao?: string | null;
  observacoes?: string | null;
  created_at?: string | Date;
  // Campos computados em listagens
  ultima_consulta?: string | Date | null;
  total_consultas?: number | null;
}

export interface CreatePacienteInput {
  nome: string;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  data_nascimento?: string;
  sexo?: string;
  peso_inicial?: number;
  altura?: number;
  data_inicio_tratamento?: string;
  objetivos?: string[];
  objetivo_texto?: string;
  nivel_atividade?: string;
  patologias?: string[];
  restricoes_alimentares?: string[];
  alergias?: string[];
  medicamentos?: string;
  suplementos?: string;
  refeicoes_por_dia?: number;
  horario_acorda?: string;
  horario_dorme?: string;
  litros_agua?: number;
  atividade_fisica?: boolean;
  atividade_fisica_descricao?: string;
  observacoes?: string;
}

export interface RefeicoesDia {
  cafe_da_manha: string[];
  lanche_manha: string[];
  almoco: string[];
  lanche_tarde: string[];
  jantar: string[];
}

export interface DiaPlano {
  dia: string;
  refeicoes: RefeicoesDia;
}

export interface PlanoSemanalConteudo {
  plano_semanal: DiaPlano[];
  gerado_por_ia?: boolean;
  criado_em?: string;
}

export interface PlanoAlimentar {
  id: string;
  paciente_id: string;
  conteudo: any;
  created_at: string | Date;
}

export interface Consulta {
  id: string;
  paciente_id: string;
  data_consulta: string | Date;
  peso?: number | null;
  cintura?: number | null;
  quadril?: number | null;
  percentual_gordura?: number | null;
  observacoes?: string | null;
  proximo_retorno?: string | Date | null;
  created_at?: string | Date;
}

export interface PacienteSemRetorno {
  paciente_id: string;
  paciente_nome: string;
  paciente_email?: string | null;
  paciente_telefone?: string | null;
  ultima_consulta: string;
  proximo_retorno?: string | null;
  dias_sem_consulta: number;
}

export interface DashboardStats {
  totalPacientesAtivos: number;
  consultasSemana: number;
  pacientesSemRetorno: PacienteSemRetorno[];
}
