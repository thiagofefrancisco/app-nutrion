import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  HeartPulse,
  Coffee,
  Check,
  Plus,
  X,
  AlertCircle,
  Calculator,
  Clock,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  formatPhone,
  calculateAge,
  calculateIMC,
  convertNumberToTimeString,
} from '@/lib/formatters';
import { createPaciente } from '@/lib/dashboard-service';
import type { Paciente } from '@/types/dashboard';

interface PacienteCreateViewProps {
  nutricionistaId: string;
  onCancel: () => void;
  onSuccess: (paciente: Paciente) => void;
}

type TabKey = 'pessoal' | 'clinico' | 'habitos';

const OBJETIVOS_OPCOES = [
  'Emagrecer',
  'Ganhar massa',
  'Controlar diabetes',
  'Saúde geral',
  'Performance esportiva',
  'Reeducação alimentar',
];

const NIVEIS_ATIVIDADE = [
  { id: 'Sedentário', label: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
  { id: 'Levemente ativo', label: 'Levemente ativo', desc: 'Exercício leve 1 a 3 dias/semana' },
  { id: 'Moderadamente ativo', label: 'Moderadamente ativo', desc: 'Exercício moderado 3 a 5 dias/semana' },
  { id: 'Muito ativo', label: 'Muito ativo', desc: 'Exercício pesado 6 a 7 dias/semana' },
  { id: 'Extremamente ativo', label: 'Extremamente ativo', desc: 'Treino de alta performance 2x ao dia' },
];

const PATOLOGIAS_PADRAO = [
  'Diabetes',
  'Hipertensão',
  'Hipotireoidismo',
  'Hipertireoidismo',
  'Síndrome do ovário policístico',
  'Doença celíaca',
  'Colesterol alto',
];

const RESTRICOES_PADRAO = [
  'Lactose',
  'Glúten',
  'Açúcar',
  'Carne vermelha',
  'Frutos do mar',
];

const ALERGIAS_PADRAO = [
  'Amendoim',
  'Leite',
  'Ovo',
  'Soja',
  'Trigo',
  'Frutos do mar',
];

export const PacienteCreateView: React.FC<PacienteCreateViewProps> = ({
  nutricionistaId,
  onCancel,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('pessoal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State: Aba 1 - Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [dataInicioTratamento, setDataInicioTratamento] = useState(() => new Date().toISOString().split('T')[0]);
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Form State: Aba 2 - Clínico
  const [pesoKg, setPesoKg] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Sedentário');

  // Patologias, restrições e alergias com tags livres e opção "Nenhum"
  const [patologias, setPatologias] = useState<string[]>([]);
  const [novaPatologia, setNovaPatologia] = useState('');

  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [novaRestricao, setNovaRestricao] = useState('');

  const [alergias, setAlergias] = useState<string[]>([]);
  const [novaAlergia, setNovaAlergia] = useState('');

  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Form State: Aba 3 - Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState<string>('3');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState(false);
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Cálculos Automáticos
  const idadeCalculada = calculateAge(dataNascimento);
  const imcCalculado = calculateIMC(pesoKg, alturaCm);

  // Manipuladores de Múltipla Escolha com opção "Nenhum" e Tags Customizadas
  const toggleArrayOptionWithNenhum = (
    currentList: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    option: string
  ) => {
    if (option === 'Nenhum') {
      if (currentList.includes('Nenhum')) {
        setList([]);
      } else {
        setList(['Nenhum']);
      }
    } else {
      let updated = currentList.filter((item) => item !== 'Nenhum');
      if (updated.includes(option)) {
        updated = updated.filter((item) => item !== option);
      } else {
        updated.push(option);
      }
      setList(updated);
    }
  };

  const handleAddCustomTag = (
    value: string,
    setValue: (val: string) => void,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      const updated = list.filter((item) => item !== 'Nenhum');
      setList([...updated, trimmed]);
    }
    setValue('');
  };

  // Conversões Automáticas de Horário (ex: 6 → "06:00", 630 → "06:30", 23 → "23:00", 2230 → "22:30")
  const handleBlurHorarioAcorda = () => {
    if (horarioAcorda) {
      setHorarioAcorda(convertNumberToTimeString(horarioAcorda));
    }
  };

  const handleBlurHorarioDorme = () => {
    if (horarioDorme) {
      setHorarioDorme(convertNumberToTimeString(horarioDorme));
    }
  };

  // Submissão do Formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Regra: O único campo obrigatório é o nome completo
    if (!nome.trim()) {
      setErrorMessage('O campo Nome Completo é obrigatório para cadastrar o paciente.');
      setActiveTab('pessoal');
      return;
    }

    setIsSubmitting(true);

    try {
      // Normalização de altura para metros caso tenha sido digitada em cm
      let alturaFinal: number | undefined = undefined;
      if (alturaCm) {
        const parsed = parseFloat(alturaCm.replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) {
          alturaFinal = parsed > 3 ? parsed / 100 : parsed;
        }
      }

      let pesoFinal: number | undefined = undefined;
      if (pesoKg) {
        const parsed = parseFloat(pesoKg.replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) {
          pesoFinal = parsed;
        }
      }

      let litrosAguaFinal: number | undefined = undefined;
      if (litrosAgua) {
        const parsed = parseFloat(litrosAgua.replace(',', '.'));
        if (!isNaN(parsed) && parsed > 0) {
          litrosAguaFinal = parsed;
        }
      }

      let refeicoesFinal: number | undefined = undefined;
      if (refeicoesPorDia) {
        const parsed = parseInt(refeicoesPorDia, 10);
        if (!isNaN(parsed) && parsed > 0) {
          refeicoesFinal = parsed;
        }
      }

      // Horários convertidos automaticamente
      const acordaFormatado = horarioAcorda ? convertNumberToTimeString(horarioAcorda) : undefined;
      const dormeFormatado = horarioDorme ? convertNumberToTimeString(horarioDorme) : undefined;

      const created = await createPaciente(nutricionistaId, {
        nome: nome.trim(),
        email: email.trim().toLowerCase() || undefined,
        telefone: telefone || undefined,
        whatsapp: whatsapp || undefined,
        data_nascimento: dataNascimento || undefined,
        sexo: sexo || undefined,
        data_inicio_tratamento: dataInicioTratamento || undefined,
        peso_inicial: pesoFinal,
        altura: alturaFinal,
        objetivos: objetivos.length > 0 ? objetivos : undefined,
        objetivo_texto: objetivoTexto.trim() || undefined,
        nivel_atividade: nivelAtividade || undefined,
        patologias: patologias.length > 0 ? patologias : undefined,
        restricoes_alimentares: restricoes.length > 0 ? restricoes : undefined,
        alergias: alergias.length > 0 ? alergias : undefined,
        medicamentos: medicamentos.trim() || undefined,
        suplementos: suplementos.trim() || undefined,
        refeicoes_por_dia: refeicoesFinal,
        horario_acorda: acordaFormatado,
        horario_dorme: dormeFormatado,
        litros_agua: litrosAguaFinal,
        atividade_fisica: praticaAtividadeFisica,
        atividade_fisica_descricao: praticaAtividadeFisica ? atividadeFisicaDescricao.trim() : undefined,
        observacoes: observacoes.trim() || undefined,
      });

      if (!created) {
        throw new Error('Não foi possível salvar o paciente no Neon.');
      }

      // Redireciona com sucesso para o perfil do paciente
      onSuccess(created);
    } catch (err: any) {
      console.error('[NutriOn] Erro ao cadastrar paciente:', err);
      setErrorMessage(err.message || 'Erro ao salvar paciente no Neon. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fade-in pb-12">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBDAD2]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-2xl bg-white border border-[#EBDAD2] hover:bg-[#FFF1E4] text-[#2C211E] flex items-center justify-center transition-colors shadow-sm"
            title="Voltar para a lista"
          >
            <ArrowLeft className="w-5 h-5 text-[#555E47]" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C211E] font-['Outfit']">
              Novo Paciente
            </h1>
            <p className="text-xs sm:text-sm text-[#7A6963] mt-0.5">
              Preencha os dados em 3 etapas simples para cadastrar o paciente no sistema.
            </p>
          </div>
        </div>

        {/* Action Buttons Top */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-[#EBDAD2] text-[#5C4D47] hover:bg-[#FFF1E4]"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            className="bg-[#999B84] hover:bg-[#858771] text-white shadow-md shadow-[#999B84]/20"
            leftIcon={<Save className="w-4 h-4 text-white" />}
          >
            Salvar Paciente
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2.5 animate-slide-up">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs Navigation (Organizado em 3 abas: Pessoal, Clínico e Hábitos) */}
      <div className="bg-white rounded-3xl p-2 border border-[#EBDAD2] shadow-sm flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('pessoal')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            activeTab === 'pessoal'
              ? 'bg-[#999B84] text-white shadow-md shadow-[#999B84]/25'
              : 'text-[#7A6963] hover:text-[#2C211E] hover:bg-[#FFF1E4]/70'
          }`}
        >
          <User className="w-4 h-4" />
          <span>1. Pessoal</span>
          {nome.trim() && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 ml-1" title="Nome preenchido" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clinico')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            activeTab === 'clinico'
              ? 'bg-[#999B84] text-white shadow-md shadow-[#999B84]/25'
              : 'text-[#7A6963] hover:text-[#2C211E] hover:bg-[#FFF1E4]/70'
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          <span>2. Clínico</span>
          {pesoKg && alturaCm && (
            <span className="w-2 h-2 rounded-full bg-emerald-300 ml-1" title="Antropometria preenchida" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('habitos')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ${
            activeTab === 'habitos'
              ? 'bg-[#999B84] text-white shadow-md shadow-[#999B84]/25'
              : 'text-[#7A6963] hover:text-[#2C211E] hover:bg-[#FFF1E4]/70'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>3. Hábitos</span>
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================= */}
        {/* ABA 1: PESSOAL */}
        {/* ========================================================= */}
        {activeTab === 'pessoal' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDAD2] shadow-sm space-y-6 animate-fade-in">
            <div className="border-b border-[#F0E4DC] pb-4">
              <h2 className="text-lg font-bold text-[#2C211E] font-['Outfit'] flex items-center gap-2">
                <User className="w-5 h-5 text-[#999B84]" />
                Dados Pessoais & Contato
              </h2>
              <p className="text-xs text-[#7A6963] mt-0.5">
                O único campo obrigatório é o nome completo do paciente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome Completo (Obrigatório) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#2C211E] mb-1.5 uppercase tracking-wider">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beatriz Alencar da Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] placeholder:text-[#7A6963]/60 focus:outline-none focus:ring-2 focus:ring-[#999B84] transition-all bg-[#FFFDFB]"
                />
              </div>

              {/* Data de Nascimento com Cálculo Automático de Idade */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                    Data de Nascimento
                  </label>
                  {idadeCalculada !== null && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] focus:outline-none focus:ring-2 focus:ring-[#999B84] transition-all bg-[#FFFDFB]"
                  />
                </div>
                <p className="text-[11px] text-[#7A6963] mt-1">
                  O sistema calcula e atualiza a idade automaticamente.
                </p>
              </div>

              {/* Sexo (Seleção Única: Feminino, Masculino, Outro) */}
              <div>
                <label className="block text-xs font-bold text-[#2C211E] mb-1.5 uppercase tracking-wider">
                  Sexo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Feminino', 'Masculino', 'Outro'] as const).map((opcao) => (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => setSexo(opcao)}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all ${
                        sexo === opcao
                          ? 'bg-[#999B84] text-white border-[#999B84] shadow-sm'
                          : 'bg-[#FFFDFB] text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                      }`}
                    >
                      {opcao}
                    </button>
                  ))}
                </div>
              </div>

              {/* Telefone Formatado */}
              <div>
                <label className="block text-xs font-bold text-[#2C211E] mb-1.5 uppercase tracking-wider">
                  Telefone
                </label>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={telefone}
                  onChange={(e) => setTelefone(formatPhone(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] placeholder:text-[#7A6963]/60 focus:outline-none focus:ring-2 focus:ring-[#999B84] transition-all bg-[#FFFDFB]"
                />
              </div>

              {/* WhatsApp Formatado com botão de copiar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                    WhatsApp
                  </label>
                  {telefone && !whatsapp && (
                    <button
                      type="button"
                      onClick={() => setWhatsapp(telefone)}
                      className="text-[11px] font-semibold text-[#999B84] hover:underline"
                    >
                      Copiar do telefone
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="(11) 98765-4321"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] placeholder:text-[#7A6963]/60 focus:outline-none focus:ring-2 focus:ring-[#999B84] transition-all bg-[#FFFDFB]"
                />
              </div>

              {/* Data de Início do Tratamento (Registrada como 1ª Consulta) */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-[#FFF1E4]/60 border border-[#EBDAD2]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#999B84]" />
                    Data de Início do Tratamento (1ª Consulta)
                  </label>
                  <span className="text-[11px] text-[#7A6963]">
                    Ficará registrada automaticamente como a primeira consulta do paciente
                  </span>
                </div>
                <input
                  type="date"
                  value={dataInicioTratamento}
                  onChange={(e) => setDataInicioTratamento(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-[#EBDAD2] text-sm text-[#2C211E] focus:outline-none focus:ring-2 focus:ring-[#999B84] transition-all bg-white"
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#2C211E] mb-1.5 uppercase tracking-wider">
                  E-mail
                </label>
                <input
                  type="email"
                  placeholder="paciente@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] placeholder:text-[#7A6963]/60 focus:outline-none focus:ring-2 focus:ring-[#999B84] transition-all bg-[#FFFDFB]"
                />
              </div>
            </div>

            {/* Navegação entre abas */}
            <div className="flex justify-end pt-4 border-t border-[#F0E4DC]">
              <Button
                type="button"
                onClick={() => setActiveTab('clinico')}
                className="bg-[#999B84] hover:bg-[#858771] text-white px-6 rounded-2xl"
              >
                Próximo: Dados Clínicos &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 2: CLÍNICO */}
        {/* ========================================================= */}
        {activeTab === 'clinico' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDAD2] shadow-sm space-y-7 animate-fade-in">
            <div className="border-b border-[#F0E4DC] pb-4">
              <h2 className="text-lg font-bold text-[#2C211E] font-['Outfit'] flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-[#999B84]" />
                Dados Clínicos & Antropometria
              </h2>
              <p className="text-xs text-[#7A6963] mt-0.5">
                Informe medidas, objetivos, condições de saúde e medicações.
              </p>
            </div>

            {/* Antropometria: Peso, Altura e IMC Automático */}
            <div className="p-5 rounded-3xl bg-[#FFF1E4]/50 border border-[#EBDAD2] space-y-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#999B84]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#2C211E]">
                  Avaliação Antropométrica & IMC
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Peso atual em kg */}
                <div>
                  <label className="block text-xs font-bold text-[#5C4D47] mb-1.5">
                    Peso atual
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 68.5"
                      value={pesoKg}
                      onChange={(e) => setPesoKg(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-white focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A6963] pointer-events-none">
                      kg
                    </span>
                  </div>
                </div>

                {/* Altura em cm */}
                <div>
                  <label className="block text-xs font-bold text-[#5C4D47] mb-1.5">
                    Altura
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      placeholder="Ex: 168"
                      value={alturaCm}
                      onChange={(e) => setAlturaCm(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-white focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A6963] pointer-events-none">
                      cm
                    </span>
                  </div>
                </div>

                {/* IMC Calculado Automaticamente (Somente Leitura) */}
                <div>
                  <label className="block text-xs font-bold text-[#5C4D47] mb-1.5">
                    IMC (Calculado)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      placeholder="—"
                      value={imcCalculado ? `${imcCalculado.imc} kg/m²` : '—'}
                      className="w-full pl-4 pr-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm font-bold text-[#2C211E] bg-[#FFF8F4] cursor-not-allowed"
                    />
                  </div>
                  {imcCalculado ? (
                    <div className="mt-1.5">
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${imcCalculado.bgClass} ${imcCalculado.colorClass}`}
                      >
                        {imcCalculado.label}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#7A6963] mt-1">
                      Preencha peso e altura para calcular.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Objetivo (Múltipla Escolha + Campo de Texto Livre) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                Objetivos do Paciente (Múltipla Escolha)
              </label>
              <div className="flex flex-wrap gap-2">
                {OBJETIVOS_OPCOES.map((obj) => {
                  const isSelected = objetivos.includes(obj);
                  return (
                    <button
                      key={obj}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setObjetivos(objetivos.filter((o) => o !== obj));
                        } else {
                          setObjetivos([...objetivos, obj]);
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-[#999B84] text-white border-[#999B84] shadow-sm'
                          : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{obj}</span>
                    </button>
                  );
                })}
              </div>

              {/* Campo de texto livre adicional para objetivo */}
              <div className="pt-1">
                <input
                  type="text"
                  placeholder="Observação ou objetivo adicional específico (opcional)..."
                  value={objetivoTexto}
                  onChange={(e) => setObjetivoTexto(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#EBDAD2] text-xs text-[#2C211E] placeholder:text-[#7A6963]/60 focus:outline-none focus:ring-2 focus:ring-[#999B84] bg-[#FFFDFB]"
                />
              </div>
            </div>

            {/* Nível de Atividade Física (Seleção Única) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                Nível de Atividade Física (Seleção Única)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {NIVEIS_ATIVIDADE.map((item) => {
                  const isSelected = nivelAtividade === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNivelAtividade(item.id)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#999B84]/15 border-[#999B84] text-[#2C211E] shadow-sm'
                          : 'bg-white border-[#EBDAD2] text-[#5C4D47] hover:bg-[#FFF1E4]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{item.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-[#555E47]" />}
                      </div>
                      <p className="text-[11px] text-[#7A6963] mt-0.5">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Patologias ou Condições de Saúde (Múltipla Escolha + Nenhum + Campo Livre) */}
            <div className="space-y-2.5 pt-2 border-t border-[#F0E4DC]">
              <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                Patologias ou Condições de Saúde
              </label>
              <div className="flex flex-wrap gap-2">
                {/* Opção Nenhum */}
                <button
                  type="button"
                  onClick={() => toggleArrayOptionWithNenhum(patologias, setPatologias, 'Nenhum')}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold border transition-all ${
                    patologias.includes('Nenhum')
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                  }`}
                >
                  Nenhum
                </button>

                {PATOLOGIAS_PADRAO.map((p) => {
                  const isSelected = patologias.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggleArrayOptionWithNenhum(patologias, setPatologias, p)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-[#999B84] text-white border-[#999B84] shadow-sm'
                          : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}

                {/* Exibição de tags personalizadas adicionadas */}
                {patologias
                  .filter((item) => item !== 'Nenhum' && !PATOLOGIAS_PADRAO.includes(item))
                  .map((custom) => (
                    <span
                      key={custom}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold bg-[#999B84] text-white"
                    >
                      <span>{custom}</span>
                      <button
                        type="button"
                        onClick={() => setPatologias(patologias.filter((item) => item !== custom))}
                        className="hover:text-red-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
              </div>

              {/* Campo para adicionar livremente */}
              <div className="flex gap-2 max-w-md pt-1">
                <input
                  type="text"
                  placeholder="Adicionar outra patologia..."
                  value={novaPatologia}
                  onChange={(e) => setNovaPatologia(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag(novaPatologia, setNovaPatologia, patologias, setPatologias);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAddCustomTag(novaPatologia, setNovaPatologia, patologias, setPatologias)
                  }
                  className="border-[#EBDAD2] text-[#555E47]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            {/* Restrições Alimentares (Múltipla Escolha + Nenhum + Campo Livre) */}
            <div className="space-y-2.5 pt-2 border-t border-[#F0E4DC]">
              <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                Restrições Alimentares
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleArrayOptionWithNenhum(restricoes, setRestricoes, 'Nenhum')}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold border transition-all ${
                    restricoes.includes('Nenhum')
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                  }`}
                >
                  Nenhum
                </button>

                {RESTRICOES_PADRAO.map((r) => {
                  const isSelected = restricoes.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleArrayOptionWithNenhum(restricoes, setRestricoes, r)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-[#999B84] text-white border-[#999B84] shadow-sm'
                          : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}

                {restricoes
                  .filter((item) => item !== 'Nenhum' && !RESTRICOES_PADRAO.includes(item))
                  .map((custom) => (
                    <span
                      key={custom}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold bg-[#999B84] text-white"
                    >
                      <span>{custom}</span>
                      <button
                        type="button"
                        onClick={() => setRestricoes(restricoes.filter((item) => item !== custom))}
                        className="hover:text-red-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
              </div>

              <div className="flex gap-2 max-w-md pt-1">
                <input
                  type="text"
                  placeholder="Adicionar outra restrição..."
                  value={novaRestricao}
                  onChange={(e) => setNovaRestricao(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag(novaRestricao, setNovaRestricao, restricoes, setRestricoes);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAddCustomTag(novaRestricao, setNovaRestricao, restricoes, setRestricoes)
                  }
                  className="border-[#EBDAD2] text-[#555E47]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            {/* Alergias Alimentares (Múltipla Escolha + Nenhum + Campo Livre) */}
            <div className="space-y-2.5 pt-2 border-t border-[#F0E4DC]">
              <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                Alergias Alimentares
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleArrayOptionWithNenhum(alergias, setAlergias, 'Nenhum')}
                  className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold border transition-all ${
                    alergias.includes('Nenhum')
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                  }`}
                >
                  Nenhum
                </button>

                {ALERGIAS_PADRAO.map((a) => {
                  const isSelected = alergias.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleArrayOptionWithNenhum(alergias, setAlergias, a)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-[#999B84] text-white border-[#999B84] shadow-sm'
                          : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}

                {alergias
                  .filter((item) => item !== 'Nenhum' && !ALERGIAS_PADRAO.includes(item))
                  .map((custom) => (
                    <span
                      key={custom}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold bg-[#999B84] text-white"
                    >
                      <span>{custom}</span>
                      <button
                        type="button"
                        onClick={() => setAlergias(alergias.filter((item) => item !== custom))}
                        className="hover:text-red-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
              </div>

              <div className="flex gap-2 max-w-md pt-1">
                <input
                  type="text"
                  placeholder="Adicionar outra alergia..."
                  value={novaAlergia}
                  onChange={(e) => setNovaAlergia(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag(novaAlergia, setNovaAlergia, alergias, setAlergias);
                    }
                  }}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleAddCustomTag(novaAlergia, setNovaAlergia, alergias, setAlergias)
                  }
                  className="border-[#EBDAD2] text-[#555E47]"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
                </Button>
              </div>
            </div>

            {/* Medicamentos Contínuos & Suplementos (Texto Livre) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#F0E4DC]">
              <div>
                <label className="block text-xs font-bold text-[#2C211E] mb-1.5 uppercase tracking-wider">
                  Medicamentos contínuos
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Levotiroxina 50mcg em jejum..."
                  value={medicamentos}
                  onChange={(e) => setMedicamentos(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C211E] mb-1.5 uppercase tracking-wider">
                  Suplementos em uso
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Creatina 5g, Whey protein 30g pós-treino..."
                  value={suplementos}
                  onChange={(e) => setSuplementos(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
              </div>
            </div>

            {/* Navegação entre abas */}
            <div className="flex items-center justify-between pt-4 border-t border-[#F0E4DC]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('pessoal')}
                className="border-[#EBDAD2] text-[#5C4D47]"
              >
                &larr; Voltar: Pessoal
              </Button>
              <Button
                type="button"
                onClick={() => setActiveTab('habitos')}
                className="bg-[#999B84] hover:bg-[#858771] text-white px-6 rounded-2xl"
              >
                Próximo: Hábitos &rarr;
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ABA 3: HÁBITOS */}
        {/* ========================================================= */}
        {activeTab === 'habitos' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDAD2] shadow-sm space-y-7 animate-fade-in">
            <div className="border-b border-[#F0E4DC] pb-4">
              <h2 className="text-lg font-bold text-[#2C211E] font-['Outfit'] flex items-center gap-2">
                <Coffee className="w-5 h-5 text-[#999B84]" />
                Hábitos & Rotina Diária
              </h2>
              <p className="text-xs text-[#7A6963] mt-0.5">
                Padrões de sono, hidratação, alimentação e rotina esportiva do paciente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Quantas refeições faz por dia */}
              <div>
                <label className="block text-xs font-bold text-[#2C211E] mb-1.5 uppercase tracking-wider">
                  Quantas refeições faz por dia
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                    className="w-24 px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm font-bold text-center text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRefeicoesPorDia(String(num))}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                          refeicoesPorDia === String(num)
                            ? 'bg-[#999B84] text-white border-[#999B84]'
                            : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                        }`}
                      >
                        {num} refeições
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quantidade de água por dia com sufixo "litros" automático */}
              <div>
                <label className="block text-xs font-bold text-[#2C211E] mb-1.5 uppercase tracking-wider">
                  Quantidade de água por dia
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.5"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                    className="w-full pl-4 pr-16 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A6963] pointer-events-none">
                    litros
                  </span>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {['1.5', '2.0', '2.5', '3.0'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLitrosAgua(l)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                        litrosAgua === l
                          ? 'bg-[#999B84] text-white border-[#999B84]'
                          : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                      }`}
                    >
                      {l} L
                    </button>
                  ))}
                </div>
              </div>

              {/* Horário que acorda com conversão automática (6 → "06:00", 630 → "06:30") */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                    Horário que acorda
                  </label>
                  {horarioAcorda && (
                    <span className="text-[11px] font-bold text-[#555E47] bg-[#999B84]/15 px-2 py-0.5 rounded-md">
                      {convertNumberToTimeString(horarioAcorda)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: 6 (06:00) ou 630 (06:30)"
                    value={horarioAcorda}
                    onChange={(e) => setHorarioAcorda(e.target.value)}
                    onBlur={handleBlurHorarioAcorda}
                    className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                  <Clock className="w-4 h-4 text-[#7A6963] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-[#7A6963] mt-1">
                  Digite números como <strong>6</strong> para 06:00 ou <strong>630</strong> para 06:30.
                </p>
              </div>

              {/* Horário que dorme com conversão automática (23 → "23:00", 2230 → "22:30") */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                    Horário que dorme
                  </label>
                  {horarioDorme && (
                    <span className="text-[11px] font-bold text-[#555E47] bg-[#999B84]/15 px-2 py-0.5 rounded-md">
                      {convertNumberToTimeString(horarioDorme)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: 23 (23:00) ou 2230 (22:30)"
                    value={horarioDorme}
                    onChange={(e) => setHorarioDorme(e.target.value)}
                    onBlur={handleBlurHorarioDorme}
                    className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                  <Clock className="w-4 h-4 text-[#7A6963] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-[#7A6963] mt-1">
                  Digite números como <strong>23</strong> para 23:00 ou <strong>2230</strong> para 22:30.
                </p>
              </div>

              {/* Pratica atividade física (sim/não — se sim, abre campo de texto) */}
              <div className="md:col-span-2 p-5 rounded-3xl bg-[#FFF1E4]/50 border border-[#EBDAD2] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                      Pratica atividade física?
                    </label>
                    <p className="text-[11px] text-[#7A6963]">
                      Indique se o paciente possui rotina ativa de exercícios.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPraticaAtividadeFisica(false)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        !praticaAtividadeFisica
                          ? 'bg-[#999B84] text-white border-[#999B84]'
                          : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setPraticaAtividadeFisica(true)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        praticaAtividadeFisica
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {/* Se sim, abre campo de texto: qual atividade e frequência semanal */}
                {praticaAtividadeFisica && (
                  <div className="pt-2 animate-slide-up space-y-1.5">
                    <label className="block text-xs font-semibold text-[#555E47]">
                      Qual atividade e frequência semanal?
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Musculação 4x na semana e corrida aos sábados (40 min)"
                      value={atividadeFisicaDescricao}
                      onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-white focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                    />
                  </div>
                )}
              </div>

              {/* Observações Gerais (Texto Livre) */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#2C211E] mb-1.5 uppercase tracking-wider">
                  Observações Gerais
                </label>
                <textarea
                  rows={3}
                  placeholder="Observações complementares, histórico alimentar, preferências, rotina familiar..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
              </div>
            </div>

            {/* Navegação entre abas e Submissão Final */}
            <div className="flex items-center justify-between pt-4 border-t border-[#F0E4DC]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('clinico')}
                className="border-[#EBDAD2] text-[#5C4D47]"
              >
                &larr; Voltar: Clínico
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="bg-[#999B84] hover:bg-[#858771] text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-[#999B84]/25"
                leftIcon={<Save className="w-4 h-4 text-white" />}
              >
                Salvar Paciente
              </Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
