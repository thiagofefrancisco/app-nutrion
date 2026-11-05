import React, { useState } from 'react';
import { X, Utensils, CheckCircle2, Sparkles, Coffee, Apple, Salad, Sandwich, Soup, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDateBR } from '@/lib/formatters';
import { baixarPlanoAlimentarPDF } from '@/lib/pdf-export';
import type { PlanoAlimentar, DiaPlano, Paciente } from '@/types/dashboard';

interface PlanoAlimentarModalProps {
  isOpen: boolean;
  onClose: () => void;
  plano: PlanoAlimentar | null;
  pacienteNome: string;
  paciente?: Paciente;
}

const REFEICOES_LABELS: Record<string, { label: string; icon: any }> = {
  cafe_da_manha: { label: 'Café da Manhã', icon: Coffee },
  lanche_manha: { label: 'Lanche da Manhã', icon: Apple },
  almoco: { label: 'Almoço', icon: Salad },
  lanche_tarde: { label: 'Lanche da Tarde', icon: Sandwich },
  jantar: { label: 'Jantar', icon: Soup },
};

export const PlanoAlimentarModal: React.FC<PlanoAlimentarModalProps> = ({
  isOpen,
  onClose,
  plano,
  pacienteNome,
  paciente,
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);

  if (!isOpen || !plano) return null;

  // Tenta extrair conteúdo estruturado ou formato texto/JSON
  let parsedContent: any = null;
  try {
    if (typeof plano.conteudo === 'string') {
      parsedContent = JSON.parse(plano.conteudo);
    } else {
      parsedContent = plano.conteudo;
    }
  } catch {
    parsedContent = plano.conteudo;
  }

  const hasPlanoSemanal = parsedContent && Array.isArray(parsedContent.plano_semanal);
  const diasSemana: DiaPlano[] = hasPlanoSemanal ? parsedContent.plano_semanal : [];
  const currentDia = diasSemana[selectedDayIdx] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-3xl max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-[#EBDAD2] flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#EBDAD2] flex items-center justify-between bg-[#FFF1E4]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#999B84] text-white flex items-center justify-center shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#2C211E] font-['Outfit']">
                  Plano Alimentar Semanal
                </h3>
                {parsedContent?.gerado_por_ia ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    IA Gemini
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Salvo no Neon
                  </span>
                )}
              </div>
              <p className="text-xs text-[#7A6963]">
                {pacienteNome} &bull; Gerado em {formatDateBR(plano.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                baixarPlanoAlimentarPDF(
                  paciente || ({ nome: pacienteNome } as Paciente),
                  plano
                )
              }
              className="border-[#999B84] text-[#555E47] hover:bg-[#999B84]/10 font-bold text-xs"
              leftIcon={<FileDown className="w-3.5 h-3.5 text-[#555E47]" />}
            >
              Baixar PDF
            </Button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl text-[#7A6963] hover:text-[#2C211E] hover:bg-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas dos Dias da Semana caso seja o novo formato semanal */}
        {hasPlanoSemanal && (
          <div className="px-6 pt-3 pb-2 border-b border-[#F0E4DC] flex gap-1.5 overflow-x-auto bg-[#FFFDFB] shrink-0">
            {diasSemana.map((d, idx) => (
              <button
                key={d.dia || idx}
                type="button"
                onClick={() => setSelectedDayIdx(idx)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedDayIdx === idx
                    ? 'bg-[#999B84] text-white shadow-sm'
                    : 'text-[#5C4D47] hover:bg-[#FFF1E4]'
                }`}
              >
                {d.dia}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#2C211E]">
          {/* Se for o formato estruturado do Prompt 6 (plano_semanal) */}
          {hasPlanoSemanal && currentDia ? (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between pb-1 border-b border-[#F0E4DC]">
                <span className="font-extrabold text-sm text-[#2C211E]">
                  Refeições de {currentDia.dia}
                </span>
                <span className="text-[11px] text-[#7A6963]">
                  5 opções nutricionais por refeição
                </span>
              </div>

              {Object.entries(currentDia.refeicoes || {}).map(([refKey, opcoes]) => {
                const config = REFEICOES_LABELS[refKey] || {
                  label: refKey,
                  icon: Utensils,
                };
                const Icon = config.icon;
                const list = Array.isArray(opcoes) ? opcoes : [];

                return (
                  <div
                    key={refKey}
                    className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2] space-y-2.5"
                  >
                    <div className="flex items-center gap-2 pb-1.5 border-b border-[#F9F5F3]">
                      <div className="w-7 h-7 rounded-lg bg-[#FFF1E4] text-[#999B84] flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs uppercase tracking-wider text-[#2C211E]">
                        {config.label}
                      </span>
                    </div>

                    <ul className="space-y-1.5 pl-1">
                      {list.map((opcao: string, optIdx: number) => (
                        <li
                          key={optIdx}
                          className="flex items-start gap-2 text-xs text-[#5C4D47]"
                        >
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FFF1E4] text-[#7A6963] shrink-0">
                            Opção {optIdx + 1}
                          </span>
                          <span className="leading-relaxed">{opcao || '—'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          ) : parsedContent && typeof parsedContent === 'object' && Array.isArray(parsedContent.refeicoes) ? (
            /* Formato de compatibilidade de planos antigos */
            <div className="space-y-4">
              {parsedContent.metaCalorica && (
                <div className="p-3.5 rounded-2xl bg-[#FFF1E4] border border-[#EBDAD2] flex items-center justify-between">
                  <span className="font-bold text-[#7A6963]">Meta Calórica Estimada:</span>
                  <span className="font-extrabold text-sm text-[#2C211E]">
                    {parsedContent.metaCalorica} kcal
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {parsedContent.refeicoes.map((ref: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2] space-y-2"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#F0E4DC]">
                      <span className="font-bold text-sm text-[#2C211E]">
                        {ref.nome || `Refeição ${idx + 1}`}
                      </span>
                      {ref.horario && (
                        <span className="text-[11px] font-semibold text-[#7A6963] px-2 py-0.5 rounded-lg bg-[#FFF1E4]">
                          {ref.horario}
                        </span>
                      )}
                    </div>
                    {Array.isArray(ref.itens) ? (
                      <ul className="space-y-1.5 pl-1">
                        {ref.itens.map((item: any, itemIdx: number) => (
                          <li key={itemIdx} className="flex items-start gap-2 text-xs text-[#5C4D47]">
                            <span className="text-[#999B84] font-bold mt-0.5">&bull;</span>
                            <span>{typeof item === 'string' ? item : item.descricao || item.nome}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-[#5C4D47] whitespace-pre-line">{ref.descricao || ref.alimentos}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : typeof parsedContent === 'string' ? (
            <div className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2] whitespace-pre-line font-mono text-xs text-[#2C211E] leading-relaxed">
              {parsedContent}
            </div>
          ) : (
            <pre className="p-4 rounded-2xl bg-[#FFFDFB] border border-[#EBDAD2] whitespace-pre-wrap font-mono text-[11px] text-[#2C211E] overflow-x-auto">
              {JSON.stringify(parsedContent, null, 2)}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#EBDAD2] bg-[#FFFDFB] flex items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-[#7A6963] flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Dados persistidos com segurança no banco de dados Neon
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                baixarPlanoAlimentarPDF(
                  paciente || ({ nome: pacienteNome } as Paciente),
                  plano
                )
              }
              className="border-[#999B84] text-[#555E47] hover:bg-[#999B84]/10 font-bold text-xs"
              leftIcon={<FileDown className="w-3.5 h-3.5 text-[#555E47]" />}
            >
              Baixar PDF
            </Button>
            <Button size="sm" onClick={onClose} variant="outline" className="border-[#EBDAD2]">
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
