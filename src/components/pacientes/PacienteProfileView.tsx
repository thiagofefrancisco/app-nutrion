import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  User,
  Calendar,
  Scale,
  Ruler,
  Plus,
  AlertCircle,
  CheckCircle2,
  CalendarPlus,
  Loader2,
  Coffee,
  HeartPulse,
  Sparkles,
  MessageCircle,
  Save,
  Utensils,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { WeightEvolutionChart } from './WeightEvolutionChart';
import { NovaConsultaModal } from './NovaConsultaModal';
import { PlanoAlimentarSection } from './PlanoAlimentarSection';
import {
  getPacienteProfile,
  updatePaciente,
  getPlanosAlimentares,
} from '@/lib/dashboard-service';
import {
  calculateAge,
  calculateIMC,
  formatDateBR,
  formatDateToInput,
  formatPhone,
  convertNumberToTimeString,
} from '@/lib/formatters';
import type { Paciente, Consulta, PlanoAlimentar } from '@/types/dashboard';

interface PacienteProfileViewProps {
  pacienteId: string;
  nutricionistaId: string;
  onBackToList: () => void;
  onDataChanged?: () => void;
  successMessage?: string | null;
  onClearSuccessMessage?: () => void;
}

type MainSection = 'dados' | 'consultas' | 'planos';
type DadosTab = 'pessoal' | 'clinico' | 'habitos';

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

export const PacienteProfileView: React.FC<PacienteProfileViewProps> = ({
  pacienteId,
  nutricionistaId,
  onBackToList,
  onDataChanged,
  successMessage,
  onClearSuccessMessage,
}) => {
  // Controle de Seção Principal (3 Seções do Prompt 5)
  const [activeSection, setActiveSection] = useState<MainSection>('dados');
  // Controle de Sub-abas da Seção 1 (Pessoal, Clínico, Hábitos)
  const [activeDadosTab, setActiveDadosTab] = useState<DadosTab>('pessoal');

  // Dados do paciente e consultas carregados do Neon
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados dos modais
  const [isNovaConsultaOpen, setIsNovaConsultaOpen] = useState(false);

  // Estados dos campos editáveis diretamente na página (Seção 1 - Dados do Paciente)
  // Aba 1 - Pessoal
  const [nome, setNome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<'Feminino' | 'Masculino' | 'Outro'>('Feminino');
  const [telefone, setTelefone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');

  // Aba 2 - Clínico
  const [pesoKg, setPesoKg] = useState('');
  const [alturaCm, setAlturaCm] = useState('');
  const [objetivos, setObjetivos] = useState<string[]>([]);
  const [objetivoTexto, setObjetivoTexto] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('Sedentário');
  const [patologias, setPatologias] = useState<string[]>([]);
  const [novaPatologia, setNovaPatologia] = useState('');
  const [restricoes, setRestricoes] = useState<string[]>([]);
  const [novaRestricao, setNovaRestricao] = useState('');
  const [alergias, setAlergias] = useState<string[]>([]);
  const [novaAlergia, setNovaAlergia] = useState('');
  const [medicamentos, setMedicamentos] = useState('');
  const [suplementos, setSuplementos] = useState('');

  // Aba 3 - Hábitos
  const [refeicoesPorDia, setRefeicoesPorDia] = useState<string>('3');
  const [horarioAcorda, setHorarioAcorda] = useState('');
  const [horarioDorme, setHorarioDorme] = useState('');
  const [litrosAgua, setLitrosAgua] = useState('');
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState(false);
  const [atividadeFisicaDescricao, setAtividadeFisicaDescricao] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Estados de feedback de salvamento
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Inicializa os campos do formulário a partir do paciente carregado
  const populateForm = useCallback((p: Paciente) => {
    setNome(p.nome || '');
    setDataNascimento(formatDateToInput(p.data_nascimento));
    setSexo((p.sexo as any) || 'Feminino');
    setTelefone(p.telefone || '');
    setWhatsapp(p.whatsapp || '');
    setEmail(p.email || '');

    // Altura em cm se metros
    const alturaDisplay = p.altura
      ? p.altura < 3
        ? String(Math.round(p.altura * 100))
        : String(p.altura)
      : '';
    setAlturaCm(alturaDisplay);
    setPesoKg(p.peso_inicial ? String(p.peso_inicial) : '');

    setObjetivos(p.objetivos || []);
    setObjetivoTexto(p.objetivo_texto || '');
    setNivelAtividade(p.nivel_atividade || 'Sedentário');
    setPatologias(p.patologias || []);
    setRestricoes(p.restricoes_alimentares || []);
    setAlergias(p.alergias || []);
    setMedicamentos(p.medicamentos || '');
    setSuplementos(p.suplementos || '');

    setRefeicoesPorDia(p.refeicoes_por_dia ? String(p.refeicoes_por_dia) : '3');
    setHorarioAcorda(p.horario_acorda || '');
    setHorarioDorme(p.horario_dorme || '');
    setLitrosAgua(p.litros_agua ? String(p.litros_agua) : '');
    setPraticaAtividadeFisica(Boolean(p.atividade_fisica));
    setAtividadeFisicaDescricao(p.atividade_fisica_descricao || '');
    setObservacoes(p.observacoes || '');
  }, []);

  // Carrega todos os dados do paciente em tempo real do Neon
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileData, planosData] = await Promise.all([
        getPacienteProfile(pacienteId, nutricionistaId),
        getPlanosAlimentares(pacienteId),
      ]);

      if (profileData) {
        setPaciente(profileData.paciente);
        setConsultas(profileData.consultas);
        populateForm(profileData.paciente);
      }
      setPlanos(planosData || []);
    } catch (err) {
      console.error('[NutriOn] Erro ao carregar perfil completo do paciente:', err);
    } finally {
      setIsLoading(false);
    }
  }, [pacienteId, nutricionistaId, populateForm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cálculos dinâmicos de Idade e IMC
  const idadeCalculada = calculateAge(dataNascimento);
  const pesoAtualCalculado = consultas[0]?.peso ? String(consultas[0].peso) : pesoKg;
  const imcInfo = calculateIMC(pesoAtualCalculado, alturaCm);

  // Manipuladores de tags com opção "Nenhum"
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

  // Salvar edições da Seção 1 no Neon
  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    if (!nome.trim()) {
      setSaveErrorMsg('O nome do paciente é obrigatório.');
      setActiveDadosTab('pessoal');
      return;
    }

    setIsSavingChanges(true);
    try {
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

      const updated = await updatePaciente(pacienteId, {
        nome: nome.trim(),
        email: email.trim().toLowerCase() || undefined,
        telefone: telefone || undefined,
        whatsapp: whatsapp || undefined,
        data_nascimento: dataNascimento || undefined,
        sexo: sexo || undefined,
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
        horario_acorda: horarioAcorda ? convertNumberToTimeString(horarioAcorda) : undefined,
        horario_dorme: horarioDorme ? convertNumberToTimeString(horarioDorme) : undefined,
        litros_agua: litrosAguaFinal,
        atividade_fisica: praticaAtividadeFisica,
        atividade_fisica_descricao: praticaAtividadeFisica ? atividadeFisicaDescricao.trim() : undefined,
        observacoes: observacoes.trim() || undefined,
      });

      if (updated) {
        setPaciente(updated);
        populateForm(updated);
      }

      setSaveSuccessMsg('Alterações do paciente salvas com sucesso no Neon!');
      onDataChanged?.();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('[NutriOn] Erro ao salvar alterações:', err);
      setSaveErrorMsg(err.message || 'Erro ao salvar alterações no Neon. Tente novamente.');
    } finally {
      setIsSavingChanges(false);
    }
  };

  // Callback de sucesso da nova consulta
  const handleConsultaCreated = async () => {
    setSaveSuccessMsg('Nova consulta registrada com sucesso!');
    await loadData();
    onDataChanged?.();
  };

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#7A6963] bg-white rounded-3xl border border-[#EBDAD2]">
        <Loader2 className="w-8 h-8 animate-spin text-[#999B84]" />
        <p className="text-sm font-medium">Carregando dados completos do paciente no Neon...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="p-12 rounded-3xl bg-white border border-[#EBDAD2] text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="font-bold text-lg text-[#2C211E]">Paciente não encontrado</h3>
        <p className="text-xs text-[#7A6963]">
          O registro solicitado não existe ou não pertence à sua conta.
        </p>
        <Button onClick={onBackToList} variant="outline" className="border-[#EBDAD2]">
          Voltar para a Lista de Pacientes
        </Button>
      </div>
    );
  }

  // Link do WhatsApp
  const rawZapDigits = paciente.whatsapp
    ? paciente.whatsapp.replace(/\D/g, '')
    : paciente.telefone
    ? paciente.telefone.replace(/\D/g, '')
    : null;
  const whatsappUrl = rawZapDigits ? `https://wa.me/55${rawZapDigits}` : null;

  return (
    <div className="space-y-6 text-left animate-fade-in pb-16">
      {/* Toast / Alerta de Sucesso Inicial do Cadastro ou Ações */}
      {successMessage && (
        <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-sm animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-emerald-900">Cadastro Concluído com Sucesso!</p>
              <p className="text-xs text-emerald-700">{successMessage}</p>
            </div>
          </div>
          {onClearSuccessMessage && (
            <button
              onClick={onClearSuccessMessage}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-emerald-100"
            >
              Fechar
            </button>
          )}
        </div>
      )}

      {/* Alerta de Sucesso ao Salvar Alterações */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-1.5 py-0.5 rounded"
          >
            &times;
          </button>
        </div>
      )}

      {/* Alerta de Erro */}
      {saveErrorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
          <button
            onClick={() => setSaveErrorMsg(null)}
            className="text-red-700 hover:text-red-900 font-bold px-1.5 py-0.5 rounded"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header com Navegação e Identificação do Paciente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EBDAD2]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToList}
            className="w-10 h-10 rounded-2xl bg-white border border-[#EBDAD2] hover:bg-[#FFF1E4] text-[#2C211E] flex items-center justify-center transition-colors shadow-sm shrink-0"
            title="Voltar para a lista"
          >
            <ArrowLeft className="w-5 h-5 text-[#555E47]" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#999B84] text-white font-bold text-lg flex items-center justify-center shadow-md shadow-[#999B84]/20 shrink-0">
              {paciente.nome ? paciente.nome.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C211E] font-['Outfit']">
                  {paciente.nome}
                </h1>
                <span className="text-[11px] font-bold text-[#7A6963] px-2.5 py-0.5 rounded-full bg-[#FFF1E4] border border-[#EBDAD2]">
                  {paciente.sexo || 'Geral'}
                </span>
                {idadeCalculada !== null && (
                  <span className="text-[11px] font-bold text-emerald-800 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7A6963] mt-0.5">
                Paciente vinculado ao seu consultório &bull; Cadastrado em{' '}
                {formatDateBR(paciente.created_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>
          )}
          <Button
            onClick={() => setIsNovaConsultaOpen(true)}
            className="bg-[#999B84] hover:bg-[#858771] text-white shadow-md shadow-[#999B84]/20"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Grid de Resumo Rápido Antropométrico */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Peso Atual */}
        <div className="p-4 rounded-3xl bg-white border border-[#EBDAD2] shadow-sm">
          <div className="flex items-center justify-between text-[#7A6963] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Peso Atual</span>
            <Scale className="w-4 h-4 text-[#999B84]" />
          </div>
          <p className="text-xl font-extrabold text-[#2C211E]">
            {consultas[0]?.peso ? `${consultas[0].peso} kg` : paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não inf.'}
          </p>
          <span className="text-[11px] text-[#7A6963]">
            {consultas.length > 0 ? `Última aferição (${formatDateBR(consultas[0].data_consulta)})` : 'Peso inicial'}
          </span>
        </div>

        {/* Altura */}
        <div className="p-4 rounded-3xl bg-white border border-[#EBDAD2] shadow-sm">
          <div className="flex items-center justify-between text-[#7A6963] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Altura</span>
            <Ruler className="w-4 h-4 text-[#999B84]" />
          </div>
          <p className="text-xl font-extrabold text-[#2C211E]">
            {paciente.altura
              ? `${paciente.altura > 3 ? (paciente.altura / 100).toFixed(2) : paciente.altura} m`
              : 'Não inf.'}
          </p>
          <span className="text-[11px] text-[#7A6963]">
            {paciente.altura && paciente.altura > 3 ? `${paciente.altura} cm` : 'Estatura'}
          </span>
        </div>

        {/* IMC */}
        <div className="p-4 rounded-3xl bg-white border border-[#EBDAD2] shadow-sm">
          <div className="flex items-center justify-between text-[#7A6963] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">IMC</span>
            <HeartPulse className="w-4 h-4 text-[#999B84]" />
          </div>
          <p className="text-xl font-extrabold text-[#2C211E]">
            {imcInfo ? `${imcInfo.imc}` : '—'}
          </p>
          {imcInfo ? (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${imcInfo.bgClass} ${imcInfo.colorClass}`}>
              {imcInfo.label}
            </span>
          ) : (
            <span className="text-[11px] text-[#7A6963]">Sem dados</span>
          )}
        </div>

        {/* Total de Consultas */}
        <div className="p-4 rounded-3xl bg-white border border-[#EBDAD2] shadow-sm">
          <div className="flex items-center justify-between text-[#7A6963] mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Consultas</span>
            <Calendar className="w-4 h-4 text-[#999B84]" />
          </div>
          <p className="text-xl font-extrabold text-[#999B84]">
            {consultas.length} {consultas.length === 1 ? 'consulta' : 'consultas'}
          </p>
          <span className="text-[11px] text-[#7A6963]">
            {consultas[0] ? `Última em ${formatDateBR(consultas[0].data_consulta)}` : 'Nenhuma ainda'}
          </span>
        </div>
      </div>

      {/* Navegador das 3 Seções Principais (Prompt 5) */}
      <div className="bg-white p-1.5 rounded-2xl border border-[#EBDAD2] shadow-sm flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setActiveSection('dados')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === 'dados'
              ? 'bg-[#999B84] text-white shadow-sm'
              : 'text-[#5C4D47] hover:bg-[#FFF1E4]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dados do Paciente</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('consultas')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === 'consultas'
              ? 'bg-[#999B84] text-white shadow-sm'
              : 'text-[#5C4D47] hover:bg-[#FFF1E4]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Consultas</span>
          {consultas.length > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeSection === 'consultas'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#FFF1E4] text-[#555E47]'
              }`}
            >
              {consultas.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('planos')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeSection === 'planos'
              ? 'bg-[#999B84] text-white shadow-sm'
              : 'text-[#5C4D47] hover:bg-[#FFF1E4]'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Planos Alimentares</span>
          {planos.length > 0 && (
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeSection === 'planos'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#FFF1E4] text-[#555E47]'
              }`}
            >
              {planos.length}
            </span>
          )}
        </button>
      </div>

      {/* ============================================================== */}
      {/* SEÇÃO 1: DADOS DO PACIENTE (3 Abas do Cadastro, 100% Editável) */}
      {/* ============================================================== */}
      {activeSection === 'dados' && (
        <form onSubmit={handleSaveChanges} className="space-y-6">
          {/* Sub-abas do Cadastro: Pessoal, Clínico, Hábitos */}
          <div className="flex border-b border-[#EBDAD2] gap-2 pb-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveDadosTab('pessoal')}
              className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                activeDadosTab === 'pessoal'
                  ? 'border-[#999B84] text-[#2C211E]'
                  : 'border-transparent text-[#7A6963] hover:text-[#2C211E]'
              }`}
            >
              <User className="w-4 h-4 text-[#999B84]" />
              <span>Aba 1: Pessoal</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDadosTab('clinico')}
              className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                activeDadosTab === 'clinico'
                  ? 'border-[#999B84] text-[#2C211E]'
                  : 'border-transparent text-[#7A6963] hover:text-[#2C211E]'
              }`}
            >
              <HeartPulse className="w-4 h-4 text-[#999B84]" />
              <span>Aba 2: Clínico</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveDadosTab('habitos')}
              className={`pb-3 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 ${
                activeDadosTab === 'habitos'
                  ? 'border-[#999B84] text-[#2C211E]'
                  : 'border-transparent text-[#7A6963] hover:text-[#2C211E]'
              }`}
            >
              <Coffee className="w-4 h-4 text-[#999B84]" />
              <span>Aba 3: Hábitos</span>
            </button>
          </div>

          {/* Sub-aba 1: Pessoal */}
          {activeDadosTab === 'pessoal' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDAD2] shadow-sm space-y-5 animate-fade-in">
              <div className="pb-3 border-b border-[#F0E4DC]">
                <h3 className="font-bold text-sm text-[#2C211E] uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-[#999B84]" />
                  Dados Pessoais & Contato
                </h3>
                <p className="text-xs text-[#7A6963] mt-0.5">
                  Edite os dados cadastrais diretamente nesta tela e clique em &quot;Salvar alterações&quot;.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome Completo */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                    Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                </div>

                {/* Data de Nascimento */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                      Data de Nascimento
                    </label>
                    {idadeCalculada !== null && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {idadeCalculada} {idadeCalculada === 1 ? 'ano' : 'anos'}
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                </div>

                {/* Sexo */}
                <div>
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                    Sexo
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Feminino', 'Masculino', 'Outro'] as const).map((opcao) => (
                      <button
                        key={opcao}
                        type="button"
                        onClick={() => setSexo(opcao)}
                        className={`py-3 px-3 rounded-2xl text-xs font-bold border transition-all ${
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

                {/* Telefone */}
                <div>
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                    Telefone
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={telefone}
                    onChange={(e) => setTelefone(formatPhone(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <div className="flex items-center justify-between mb-1">
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
                    className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                </div>

                {/* E-mail */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="paciente@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-[#EBDAD2] text-sm text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sub-aba 2: Clínico */}
          {activeDadosTab === 'clinico' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDAD2] shadow-sm space-y-6 animate-fade-in">
              <div className="pb-3 border-b border-[#F0E4DC]">
                <h3 className="font-bold text-sm text-[#2C211E] uppercase tracking-wider flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-[#999B84]" />
                  Dados Clínicos & Antropometria
                </h3>
                <p className="text-xs text-[#7A6963] mt-0.5">
                  Atualize medidas, objetivos, patologias e medicamentos.
                </p>
              </div>

              {/* Antropometria Inicial */}
              <div className="p-4 rounded-2xl bg-[#FFF1E4]/50 border border-[#EBDAD2] space-y-3">
                <span className="text-xs font-bold text-[#2C211E] uppercase tracking-wider block">
                  Antropometria de Referência
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Peso Inicial */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5C4D47] mb-1">
                      Peso Inicial (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 68.5"
                      value={pesoKg}
                      onChange={(e) => setPesoKg(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-white focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                    />
                  </div>

                  {/* Altura */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5C4D47] mb-1">
                      Altura (cm)
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="Ex: 168"
                      value={alturaCm}
                      onChange={(e) => setAlturaCm(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-white focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                    />
                  </div>

                  {/* IMC Calculado */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5C4D47] mb-1">
                      IMC Calculado
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#2C211E]">
                        {imcInfo ? `${imcInfo.imc}` : '—'}
                      </span>
                      {imcInfo && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${imcInfo.bgClass} ${imcInfo.colorClass}`}>
                          {imcInfo.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Objetivos */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                  Objetivos do Paciente
                </label>
                <div className="flex flex-wrap gap-2">
                  {OBJETIVOS_OPCOES.map((opcao) => {
                    const isSelected = objetivos.includes(opcao);
                    return (
                      <button
                        key={opcao}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setObjetivos(objetivos.filter((item) => item !== opcao));
                          } else {
                            setObjetivos([...objetivos, opcao]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-[#999B84] text-white border-[#999B84] shadow-sm'
                            : 'bg-[#FFFDFB] text-[#5C4D47] border-[#EBDAD2] hover:bg-[#FFF1E4]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {opcao}
                      </button>
                    );
                  })}
                </div>

                <textarea
                  rows={2}
                  placeholder="Detalhes ou metas adicionais para o plano..."
                  value={objetivoTexto}
                  onChange={(e) => setObjetivoTexto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
              </div>

              {/* Nível de Atividade Física */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                  Nível de Atividade Física
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {NIVEIS_ATIVIDADE.map((nivel) => (
                    <button
                      key={nivel.id}
                      type="button"
                      onClick={() => setNivelAtividade(nivel.id)}
                      className={`p-3 rounded-2xl text-left border transition-all ${
                        nivelAtividade === nivel.id
                          ? 'bg-[#999B84]/15 border-[#999B84] text-[#2C211E]'
                          : 'bg-[#FFFDFB] border-[#EBDAD2] text-[#5C4D47] hover:bg-[#FFF1E4]'
                      }`}
                    >
                      <span className="font-bold text-xs block text-[#2C211E]">{nivel.label}</span>
                      <span className="text-[11px] text-[#7A6963] block mt-0.5">{nivel.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Patologias */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                  Patologias / Condições de Saúde
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleArrayOptionWithNenhum(patologias, setPatologias, 'Nenhum')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      patologias.includes('Nenhum')
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-[#FFFDFB] text-[#5C4D47] border-[#EBDAD2]'
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                          isSelected
                            ? 'bg-red-500 text-white border-red-500'
                            : 'bg-[#FFFDFB] text-[#5C4D47] border-[#EBDAD2]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {p}
                      </button>
                    );
                  })}
                  {patologias
                    .filter((p) => p !== 'Nenhum' && !PATOLOGIAS_PADRAO.includes(p))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-100 text-red-900 border border-red-300"
                      >
                        {custom}
                        <button
                          type="button"
                          onClick={() => setPatologias(patologias.filter((item) => item !== custom))}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                </div>
                <div className="flex gap-2">
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
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#EBDAD2] text-xs bg-[#FFFDFB]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddCustomTag(novaPatologia, setNovaPatologia, patologias, setPatologias)}
                    className="border-[#EBDAD2]"
                  >
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Restrições Alimentares */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                  Restrições Alimentares
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleArrayOptionWithNenhum(restricoes, setRestricoes, 'Nenhum')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      restricoes.includes('Nenhum')
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-[#FFFDFB] text-[#5C4D47] border-[#EBDAD2]'
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-[#FFFDFB] text-[#5C4D47] border-[#EBDAD2]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {r}
                      </button>
                    );
                  })}
                  {restricoes
                    .filter((r) => r !== 'Nenhum' && !RESTRICOES_PADRAO.includes(r))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                      >
                        {custom}
                        <button
                          type="button"
                          onClick={() => setRestricoes(restricoes.filter((item) => item !== custom))}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar outra restrição alimentar..."
                    value={novaRestricao}
                    onChange={(e) => setNovaRestricao(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag(novaRestricao, setNovaRestricao, restricoes, setRestricoes);
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#EBDAD2] text-xs bg-[#FFFDFB]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddCustomTag(novaRestricao, setNovaRestricao, restricoes, setRestricoes)}
                    className="border-[#EBDAD2]"
                  >
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Alergias Alimentares */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider">
                  Alergias Alimentares
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleArrayOptionWithNenhum(alergias, setAlergias, 'Nenhum')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      alergias.includes('Nenhum')
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-[#FFFDFB] text-[#5C4D47] border-[#EBDAD2]'
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
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                          isSelected
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-[#FFFDFB] text-[#5C4D47] border-[#EBDAD2]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {a}
                      </button>
                    );
                  })}
                  {alergias
                    .filter((a) => a !== 'Nenhum' && !ALERGIAS_PADRAO.includes(a))
                    .map((custom) => (
                      <span
                        key={custom}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-100 text-orange-900 border border-orange-300"
                      >
                        {custom}
                        <button
                          type="button"
                          onClick={() => setAlergias(alergias.filter((item) => item !== custom))}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Adicionar outra alergia alimentar..."
                    value={novaAlergia}
                    onChange={(e) => setNovaAlergia(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag(novaAlergia, setNovaAlergia, alergias, setAlergias);
                      }
                    }}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#EBDAD2] text-xs bg-[#FFFDFB]"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddCustomTag(novaAlergia, setNovaAlergia, alergias, setAlergias)}
                    className="border-[#EBDAD2]"
                  >
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Medicamentos & Suplementos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                    Medicamentos Contínuos
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Metformina 500mg, Losartana..."
                    value={medicamentos}
                    onChange={(e) => setMedicamentos(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                    Suplementos em Uso
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Creatina 5g, Whey Protein, Vitamina D..."
                    value={suplementos}
                    onChange={(e) => setSuplementos(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sub-aba 3: Hábitos */}
          {activeDadosTab === 'habitos' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDAD2] shadow-sm space-y-6 animate-fade-in">
              <div className="pb-3 border-b border-[#F0E4DC]">
                <h3 className="font-bold text-sm text-[#2C211E] uppercase tracking-wider flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-[#999B84]" />
                  Hábitos de Vida & Rotina Diária
                </h3>
                <p className="text-xs text-[#7A6963] mt-0.5">
                  Edite horários, ingestão de água, refeições e atividade física do paciente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Refeições por Dia */}
                <div>
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                    Refeições por Dia
                  </label>
                  <select
                    value={refeicoesPorDia}
                    onChange={(e) => setRefeicoesPorDia(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'refeição' : 'refeições'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Horário que Acorda */}
                <div>
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                    Horário que Acorda
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 06:30"
                    value={horarioAcorda}
                    onChange={(e) => setHorarioAcorda(e.target.value)}
                    onBlur={() => {
                      if (horarioAcorda) setHorarioAcorda(convertNumberToTimeString(horarioAcorda));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                </div>

                {/* Horário que Dorme */}
                <div>
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                    Horário que Dorme
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 22:30"
                    value={horarioDorme}
                    onChange={(e) => setHorarioDorme(e.target.value)}
                    onBlur={() => {
                      if (horarioDorme) setHorarioDorme(convertNumberToTimeString(horarioDorme));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                </div>

                {/* Ingestão de Água */}
                <div>
                  <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                    Ingestão de Água (L/dia)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.5"
                    value={litrosAgua}
                    onChange={(e) => setLitrosAgua(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                  />
                </div>
              </div>

              {/* Atividade Física Regular */}
              <div className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#2C211E] uppercase tracking-wider block">
                      Prática de Atividade Física Regular
                    </span>
                    <p className="text-[11px] text-[#7A6963]">
                      O paciente pratica treinos, musculação, caminhada ou outros esportes?
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPraticaAtividadeFisica(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        !praticaAtividadeFisica
                          ? 'bg-[#999B84] text-white border-[#999B84]'
                          : 'bg-white text-[#5C4D47] border-[#EBDAD2]'
                      }`}
                    >
                      Não
                    </button>
                    <button
                      type="button"
                      onClick={() => setPraticaAtividadeFisica(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        praticaAtividadeFisica
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-[#5C4D47] border-[#EBDAD2]'
                      }`}
                    >
                      Sim
                    </button>
                  </div>
                </div>

                {praticaAtividadeFisica && (
                  <div className="pt-2 border-t border-[#F0E4DC] animate-slide-up">
                    <label className="block text-xs font-bold text-[#5C4D47] mb-1">
                      Descreva a atividade física (modalidade, frequência e intensidade):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Musculação 4x na semana, 50 min com intensidade moderada a alta"
                      value={atividadeFisicaDescricao}
                      onChange={(e) => setAtividadeFisicaDescricao(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-white focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                    />
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div>
                <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                  Observações Gerais da Anamnese
                </label>
                <textarea
                  rows={3}
                  placeholder="Anotações adicionais, preferências gastronômicas, histórico familiar..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
              </div>
            </div>
          )}

          {/* Botão Salvar Alterações (Prompt 5: Botão "Salvar alterações" para confirmar as edições) */}
          <div className="bg-white p-4 rounded-3xl border border-[#EBDAD2] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20">
            <div className="text-xs text-[#7A6963] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#999B84]" />
              <span>Edições são sincronizadas diretamente no banco de dados Neon</span>
            </div>

            <Button
              type="submit"
              isLoading={isSavingChanges}
              className="w-full sm:w-auto bg-[#999B84] hover:bg-[#858771] text-white px-8 py-3 rounded-2xl shadow-md shadow-[#999B84]/20"
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar alterações
            </Button>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* SEÇÃO 2: CONSULTAS (Gráfico de Peso + Nova Consulta + Lista)   */}
      {/* ============================================================== */}
      {activeSection === 'consultas' && (
        <div className="space-y-6 animate-fade-in">
          {/* Header da Seção de Consultas */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-6 rounded-3xl border border-[#EBDAD2] shadow-sm">
            <div>
              <h3 className="font-bold text-lg text-[#2C211E] font-['Outfit'] flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#999B84]" />
                Histórico de Consultas & Evolução
              </h3>
              <p className="text-xs text-[#7A6963] mt-0.5">
                Gráfico de evolução de peso e registro de aferições do paciente.
              </p>
            </div>

            <Button
              onClick={() => setIsNovaConsultaOpen(true)}
              className="bg-[#999B84] hover:bg-[#858771] text-white shadow-md shadow-[#999B84]/20 shrink-0"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Nova Consulta
            </Button>
          </div>

          {/* Gráfico de Evolução de Peso em Destaque (Sempre Visível) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDAD2] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4DC]">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#999B84]" />
                <h4 className="font-bold text-sm text-[#2C211E] uppercase tracking-wider">
                  Gráfico de Evolução de Peso
                </h4>
              </div>
              <span className="text-xs font-semibold text-[#7A6963]">
                {consultas.length} {consultas.length === 1 ? 'aferição' : 'aferições'}
              </span>
            </div>

            <WeightEvolutionChart consultas={consultas} />
          </div>

          {/* Lista de Todas as Consultas (Ordem cronológica decrescente) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EBDAD2] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4DC]">
              <h4 className="font-bold text-sm text-[#2C211E] uppercase tracking-wider flex items-center gap-2">
                <CalendarPlus className="w-4 h-4 text-[#999B84]" />
                Lista de Consultas Realizadas
              </h4>
              <span className="text-xs text-[#7A6963]">Mais recente primeiro</span>
            </div>

            {consultas.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#FFFDFB] border border-dashed border-[#EBDAD2] text-center text-xs text-[#7A6963] space-y-2">
                <Calendar className="w-8 h-8 text-[#999B84]/60 mx-auto" />
                <p className="font-semibold text-[#2C211E]">
                  Nenhuma consulta registrada ainda para {paciente.nome}.
                </p>
                <p>
                  Clique no botão &quot;Nova Consulta&quot; acima para registrar a primeira consulta.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {consultas.map((cons) => (
                  <div
                    key={cons.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs hover:border-[#999B84] transition-colors"
                  >
                    <div className="space-y-2 flex-1">
                      {/* Data e Métricas */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#2C211E] px-2.5 py-1 rounded-xl bg-white border border-[#EBDAD2]">
                          📅 {formatDateBR(cons.data_consulta)}
                        </span>
                        {cons.peso && (
                          <span className="px-2.5 py-1 rounded-xl bg-[#FFF1E4] text-[#555E47] font-bold border border-[#EBDAD2]">
                            ⚖️ {cons.peso} kg
                          </span>
                        )}
                        {cons.cintura && (
                          <span className="px-2.5 py-1 rounded-xl bg-white text-[#7A6963] font-medium border border-[#EBDAD2]">
                            Cintura: <strong className="text-[#2C211E]">{cons.cintura} cm</strong>
                          </span>
                        )}
                        {cons.quadril && (
                          <span className="px-2.5 py-1 rounded-xl bg-white text-[#7A6963] font-medium border border-[#EBDAD2]">
                            Quadril: <strong className="text-[#2C211E]">{cons.quadril} cm</strong>
                          </span>
                        )}
                        {cons.percentual_gordura && (
                          <span className="px-2.5 py-1 rounded-xl bg-white text-[#7A6963] font-medium border border-[#EBDAD2]">
                            Gordura: <strong className="text-[#2C211E]">{cons.percentual_gordura}%</strong>
                          </span>
                        )}
                      </div>

                      {/* Observações */}
                      {cons.observacoes && (
                        <p className="text-[#5C4D47] leading-relaxed bg-white/70 p-2.5 rounded-xl border border-[#F0E4DC]">
                          {cons.observacoes}
                        </p>
                      )}
                    </div>

                    {/* Próximo Retorno */}
                    <div className="shrink-0 text-left md:text-right">
                      {cons.proximo_retorno ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-2xl font-bold border border-emerald-200">
                          <CalendarPlus className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Retorno: {formatDateBR(cons.proximo_retorno)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#7A6963] bg-[#FFF1E4] px-2.5 py-1 rounded-xl font-medium border border-[#EBDAD2]">
                          Sem retorno agendado
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SEÇÃO 3: PLANOS ALIMENTARES (Geração por IA & Edição em Abas)  */}
      {/* ============================================================== */}
      {activeSection === 'planos' && (
        <PlanoAlimentarSection
          paciente={paciente}
          initialPlanos={planos}
          onDataChanged={() => {
            loadData();
            onDataChanged?.();
          }}
        />
      )}

      {/* Modal para Registrar Nova Consulta */}
      <NovaConsultaModal
        isOpen={isNovaConsultaOpen}
        onClose={() => setIsNovaConsultaOpen(false)}
        pacienteId={paciente.id}
        pacienteNome={paciente.nome}
        onSuccess={handleConsultaCreated}
      />
    </div>
  );
};
