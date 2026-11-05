import type { Paciente, PlanoSemanalConteudo, DiaPlano } from '@/types/dashboard';
import { calculateAge, calculateIMC, formatDateBR } from './formatters';

const REFEICAO_LABELS: Record<string, { label: string; icon: string }> = {
  cafe_da_manha: { label: 'Café da Manhã', icon: '☕' },
  lanche_manha: { label: 'Lanche da Manhã', icon: '🍎' },
  almoco: { label: 'Almoço', icon: '🥗' },
  lanche_tarde: { label: 'Lanche da Tarde', icon: '🥪' },
  jantar: { label: 'Jantar', icon: '🍲' },
};

/**
 * Normaliza os dados do plano alimentar em uma estrutura garantida de dias e refeições
 */
function normalizePlanoSemanal(plano: any): DiaPlano[] {
  if (!plano) return [];

  // Se já tiver plano_semanal
  if (Array.isArray(plano.plano_semanal)) {
    return plano.plano_semanal;
  }

  // Se estiver aninhado em plano.conteudo
  if (plano.conteudo && Array.isArray(plano.conteudo.plano_semanal)) {
    return plano.conteudo.plano_semanal;
  }

  // Se plano.conteudo for string JSON
  if (typeof plano.conteudo === 'string') {
    try {
      const parsed = JSON.parse(plano.conteudo);
      if (Array.isArray(parsed.plano_semanal)) {
        return parsed.plano_semanal;
      }
    } catch {
      // fallback
    }
  }

  return [];
}

/**
 * Gera o documento HTML profissional estilizado para exportação e impressão de PDF
 */
export function generatePlanoPDFHtml(
  paciente: Paciente,
  plano: PlanoSemanalConteudo | any,
  nutricionistaNome?: string
): string {
  const dias = normalizePlanoSemanal(plano);
  const dataHoje = new Date().toLocaleDateString('pt-BR');
  const idade = paciente.data_nascimento ? calculateAge(paciente.data_nascimento) : null;
  const imcInfo = calculateIMC(paciente.peso_inicial, paciente.altura);

  // Formata altura
  const alturaDisplay = paciente.altura
    ? paciente.altura > 3
      ? `${(paciente.altura / 100).toFixed(2)} m`
      : `${paciente.altura} m`
    : 'Não informada';

  // Alergias e Restrições combinadas
  const alergiasList = paciente.alergias || [];
  const restricoesList = paciente.restricoes_alimentares || [];
  const patologiasList = paciente.patologias || [];
  const objetivosList =
    paciente.objetivos && paciente.objetivos.length > 0
      ? paciente.objetivos.join(', ')
      : paciente.objetivo_texto || 'Reeducação Alimentar e Saúde';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Plano Alimentar - ${paciente.nome}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #2C211E;
      background-color: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 11pt;
      line-height: 1.4;
    }

    /* Cabeçalho da Clínica */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      border-bottom: 2px solid #999B84;
      margin-bottom: 14px;
    }

    .brand-title {
      font-size: 20pt;
      font-weight: 800;
      color: #555E47;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .brand-subtitle {
      font-size: 9pt;
      color: #7A6963;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
      margin-top: 2px;
    }

    .meta-box {
      text-align: right;
      font-size: 9pt;
      color: #7A6963;
    }

    .meta-box strong {
      color: #2C211E;
    }

    /* Card de Dados do Paciente */
    .patient-card {
      background-color: #FAF6F3;
      border: 1px solid #EBDAD2;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }

    .patient-name {
      font-size: 14pt;
      font-weight: 700;
      color: #2C211E;
      margin-bottom: 8px;
    }

    .patient-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px 14px;
      font-size: 9.5pt;
    }

    .field-label {
      color: #7A6963;
      font-size: 8pt;
      text-transform: uppercase;
      font-weight: 700;
      display: block;
      margin-bottom: 1px;
    }

    .field-value {
      font-weight: 600;
      color: #2C211E;
    }

    .alert-tag {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 6px;
      font-size: 8.5pt;
      font-weight: 700;
      background-color: #FFF1E4;
      color: #935A50;
      border: 1px solid #EBDAD2;
      margin-right: 4px;
      margin-top: 2px;
    }

    /* Seção do Cardápio Semanal */
    .section-title {
      font-size: 13pt;
      font-weight: 800;
      color: #555E47;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 16px 0 10px 0;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #EBDAD2;
    }

    /* Bloco de cada Dia */
    .day-block {
      background-color: #FFFFFF;
      border: 1.5px solid #EBDAD2;
      border-radius: 12px;
      margin-bottom: 14px;
      overflow: hidden;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .day-header {
      background-color: #999B84;
      color: #FFFFFF;
      padding: 8px 14px;
      font-size: 11pt;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .day-badge {
      background-color: rgba(255, 255, 255, 0.25);
      font-size: 8pt;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
    }

    .meals-container {
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .meal-box {
      border-left: 3px solid #C58B7E;
      padding-left: 10px;
    }

    .meal-title {
      font-size: 10pt;
      font-weight: 700;
      color: #8C5549;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .options-list {
      margin: 0;
      padding-left: 18px;
      font-size: 9.5pt;
      color: #3C302B;
    }

    .options-list li {
      margin-bottom: 2px;
    }

    .options-list li strong {
      color: #7A6963;
      font-size: 8pt;
      margin-right: 4px;
    }

    /* Orientações Gerais */
    .tips-block {
      background-color: #F8F9F5;
      border: 1px solid #D9DEC7;
      border-radius: 12px;
      padding: 12px 16px;
      margin-top: 16px;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .tips-title {
      font-size: 10.5pt;
      font-weight: 700;
      color: #555E47;
      margin-bottom: 6px;
    }

    .tips-list {
      margin: 0;
      padding-left: 18px;
      font-size: 9pt;
      color: #4D453E;
    }

    .tips-list li {
      margin-bottom: 3px;
    }

    /* Rodapé do documento */
    .footer {
      margin-top: 24px;
      padding-top: 14px;
      border-top: 1px dashed #CBBBAF;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8.5pt;
      color: #7A6963;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .signature-area {
      text-align: center;
      width: 200px;
      border-top: 1px solid #7A6963;
      padding-top: 4px;
      margin-top: 25px;
      font-weight: 600;
      color: #2C211E;
    }

    @media print {
      body {
        background-color: transparent;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Cabeçalho -->
  <div class="header">
    <div>
      <div class="brand-title">🌿 NutriOn</div>
      <div class="brand-subtitle">Plano Alimentar Nutricional Individualizado</div>
    </div>
    <div class="meta-box">
      <div>Data de Emissão: <strong>${dataHoje}</strong></div>
      ${nutricionistaNome ? `<div>Nutricionista: <strong>${nutricionistaNome}</strong></div>` : ''}
    </div>
  </div>

  <!-- Identificação do Paciente -->
  <div class="patient-card">
    <div class="patient-name">${paciente.nome}</div>
    <div class="patient-grid">
      <div>
        <span class="field-label">Idade / Sexo</span>
        <span class="field-value">${idade !== null ? `${idade} anos` : 'Não inf.'} &bull; ${paciente.sexo || 'Geral'}</span>
      </div>
      <div>
        <span class="field-label">Peso / Altura</span>
        <span class="field-value">${paciente.peso_inicial ? `${paciente.peso_inicial} kg` : 'Não inf.'} &bull; ${alturaDisplay}</span>
      </div>
      <div>
        <span class="field-label">IMC</span>
        <span class="field-value">${imcInfo ? `${imcInfo.imc} (${imcInfo.label})` : 'Não calculado'}</span>
      </div>
      <div>
        <span class="field-label">Meta de Hidratação</span>
        <span class="field-value">${paciente.litros_agua ? `${paciente.litros_agua} Litros / dia` : 'Mínimo 2 a 2.5L / dia'}</span>
      </div>
      <div style="grid-column: span 2;">
        <span class="field-label">Objetivo Principal</span>
        <span class="field-value">${objetivosList}</span>
      </div>
      <div style="grid-column: span 2;">
        <span class="field-label">Alergias e Restrições</span>
        <div>
          ${
            alergiasList.length > 0 || restricoesList.length > 0
              ? [...alergiasList, ...restricoesList]
                  .map((item) => `<span class="alert-tag">⚠️ ${item}</span>`)
                  .join('')
              : '<span class="field-value" style="font-weight: normal; color: #555E47;">Nenhuma restrição registrada</span>'
          }
        </div>
      </div>
    </div>
  </div>

  <!-- Cardápio Semanal -->
  <div class="section-title">Cardápio Semanal Completo (Opções por Refeição)</div>

  ${dias
    .map((diaItem, idx) => {
      const refeicoes = diaItem.refeicoes || {};
      const refeicaoKeys: (keyof DiaPlano['refeicoes'])[] = [
        'cafe_da_manha',
        'lanche_manha',
        'almoco',
        'lanche_tarde',
        'jantar',
      ];

      return `
      <div class="day-block">
        <div class="day-header">
          <span>${diaItem.dia || `Dia ${idx + 1}`}</span>
          <span class="day-badge">5 opções variadas</span>
        </div>
        <div class="meals-container">
          ${refeicaoKeys
            .map((refKey) => {
              const meta = REFEICAO_LABELS[refKey] || { label: refKey, icon: '🍴' };
              const opcoes: string[] = Array.isArray(refeicoes[refKey]) ? (refeicoes[refKey] as string[]) : [];

              if (opcoes.length === 0) return '';

              return `
              <div class="meal-box">
                <div class="meal-title">
                  <span>${meta.icon}</span>
                  <span>${meta.label}</span>
                </div>
                <ul class="options-list">
                  ${opcoes
                    .filter((op) => Boolean(op && op.trim()))
                    .map((op, opIdx) => `<li><strong>Opção ${opIdx + 1}:</strong> ${op}</li>`)
                    .join('')}
                </ul>
              </div>
            `;
            })
            .join('')}
        </div>
      </div>
    `;
    })
    .join('')}

  <!-- Orientações Gerais -->
  <div class="tips-block">
    <div class="tips-title">💡 Recomendações e Orientações Clínicas</div>
    <ul class="tips-list">
      <li><strong>Hidratação Constante:</strong> Consuma água ao longo de todo o dia, preferencialmente fora dos momentos de refeição principal.</li>
      <li><strong>Variedade e Flexibilidade:</strong> Você pode alternar livremente entre as 5 opções de cada refeição conforme sua preferência e rotina.</li>
      <li><strong>Mastigação Consciente:</strong> Coma com calma, mastigando bem os alimentos para favorecer a digestão e o sinal de saciedade.</li>
      ${
        paciente.observacoes
          ? `<li><strong>Observações da sua Anamnese:</strong> ${paciente.observacoes}</li>`
          : ''
      }
    </ul>
  </div>

  <!-- Rodapé e Assinatura -->
  <div class="footer">
    <div>
      <div>Documento elaborado através do sistema <strong>NutriOn</strong>.</div>
      <div style="font-size: 7.5pt; color: #9A8983; margin-top: 2px;">
        As orientações contidas neste plano são personalizadas e confidenciais para o paciente ${paciente.nome}.
      </div>
    </div>
    <div class="signature-area">
      Assinatura / Carimbo
    </div>
  </div>

</body>
</html>`;
}

/**
 * Dispara a impressão/salvamento do plano alimentar como PDF formatado no navegador do usuário.
 */
export function baixarPlanoAlimentarPDF(
  paciente: Paciente,
  plano: PlanoSemanalConteudo | any,
  nutricionistaNome?: string
): void {
  const html = generatePlanoPDFHtml(paciente, plano, nutricionistaNome);

  // Utiliza um iframe invisível para abrir direto a janela de impressão/PDF do navegador sem pop-up bloqueado
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.warn('[NutriOn] Fallback para janela de impressão:', err);
  }

  // Fallback para caso iframes sejam bloqueados
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 400);
  }
}

