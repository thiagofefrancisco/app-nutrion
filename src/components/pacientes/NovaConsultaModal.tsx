import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createConsulta } from '@/lib/dashboard-service';

interface NovaConsultaModalProps {
  isOpen: boolean;
  onClose: () => void;
  pacienteId: string;
  pacienteNome: string;
  onSuccess: () => void;
}

export const NovaConsultaModal: React.FC<NovaConsultaModalProps> = ({
  isOpen,
  onClose,
  pacienteId,
  pacienteNome,
  onSuccess,
}) => {
  // Preenchida automaticamente com hoje (YYYY-MM-DD), editável
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const [dataConsulta, setDataConsulta] = useState(getTodayDate());
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [quadril, setQuadril] = useState('');
  const [percentualGordura, setPercentualGordura] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [proximoRetorno, setProximoRetorno] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reseta campos quando o modal abre
  useEffect(() => {
    if (isOpen) {
      setDataConsulta(getTodayDate());
      setPeso('');
      setCintura('');
      setQuadril('');
      setPercentualGordura('');
      setObservacoes('');
      setProximoRetorno('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!dataConsulta) {
      setErrorMsg('Por favor, informe a data da consulta.');
      return;
    }

    if (!peso || isNaN(parseFloat(peso.replace(',', '.')))) {
      setErrorMsg('Por favor, informe o peso atual do paciente em kg.');
      return;
    }

    setIsSubmitting(true);
    try {
      const pesoNum = parseFloat(peso.replace(',', '.'));
      const cinturaNum = cintura ? parseFloat(cintura.replace(',', '.')) : undefined;
      const quadrilNum = quadril ? parseFloat(quadril.replace(',', '.')) : undefined;
      const gorduraNum = percentualGordura ? parseFloat(percentualGordura.replace(',', '.')) : undefined;

      await createConsulta(pacienteId, {
        data_consulta: dataConsulta,
        peso: pesoNum,
        cintura: cinturaNum,
        quadril: quadrilNum,
        percentual_gordura: gorduraNum,
        observacoes: observacoes.trim() || undefined,
        proximo_retorno: proximoRetorno || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('[NutriOn] Erro ao registrar consulta:', err);
      setErrorMsg(err.message || 'Erro ao registrar a consulta no banco de dados Neon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop com desfoque */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#EBDAD2] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EBDAD2] flex items-center justify-between bg-[#FFF1E4]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#999B84] text-white flex items-center justify-center shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#2C211E] font-['Outfit']">
                Nova Consulta
              </h3>
              <p className="text-xs text-[#7A6963]">
                Paciente: <span className="font-semibold text-[#2C211E]">{pacienteNome}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-[#7A6963] hover:text-[#2C211E] hover:bg-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-800 border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Data da consulta (preenchida automaticamente com hoje, editável) */}
            <div>
              <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                Data da Consulta <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={dataConsulta}
                onChange={(e) => setDataConsulta(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
              />
            </div>

            {/* Peso atual em kg (número) */}
            <div>
              <label className="block text-xs font-bold text-[#2C211E] uppercase tracking-wider mb-1">
                Peso Atual (kg) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  required
                  placeholder="Ex: 68.5"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A6963]">
                  kg
                </span>
              </div>
            </div>

            {/* Cintura em cm (número, opcional) */}
            <div>
              <label className="block text-xs font-bold text-[#5C4D47] uppercase tracking-wider mb-1">
                Cintura (cm) <span className="text-[10px] text-[#7A6963] font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 75.0"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A6963]">
                  cm
                </span>
              </div>
            </div>

            {/* Quadril em cm (número, opcional) */}
            <div>
              <label className="block text-xs font-bold text-[#5C4D47] uppercase tracking-wider mb-1">
                Quadril (cm) <span className="text-[10px] text-[#7A6963] font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 98.0"
                  value={quadril}
                  onChange={(e) => setQuadril(e.target.value)}
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A6963]">
                  cm
                </span>
              </div>
            </div>

            {/* % de gordura (número, opcional) */}
            <div>
              <label className="block text-xs font-bold text-[#5C4D47] uppercase tracking-wider mb-1">
                % de Gordura <span className="text-[10px] text-[#7A6963] font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 22.5"
                  value={percentualGordura}
                  onChange={(e) => setPercentualGordura(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7A6963]">
                  %
                </span>
              </div>
            </div>

            {/* Próximo retorno (seletor de data) */}
            <div>
              <label className="block text-xs font-bold text-[#5C4D47] uppercase tracking-wider mb-1">
                Próximo Retorno <span className="text-[10px] text-[#7A6963] font-normal">(opcional)</span>
              </label>
              <input
                type="date"
                value={proximoRetorno}
                onChange={(e) => setProximoRetorno(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
              />
            </div>
          </div>

          {/* Observações (texto livre) */}
          <div>
            <label className="block text-xs font-bold text-[#5C4D47] uppercase tracking-wider mb-1">
              Observações & Evolução Nutricional
            </label>
            <textarea
              rows={3}
              placeholder="Descreva a evolução do paciente, adesão à dieta, novas metas, conduta clínica..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#EBDAD2] text-xs text-[#2C211E] bg-[#FFFDFB] focus:outline-none focus:ring-2 focus:ring-[#999B84]"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-[#F0E4DC] flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-[#EBDAD2]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isSubmitting}
              className="bg-[#999B84] hover:bg-[#858771] text-white px-5"
            >
              Salvar consulta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
