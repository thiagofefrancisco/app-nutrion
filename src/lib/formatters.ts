/**
 * Utilitários de formatação e cálculos para o sistema NutriOn
 */

/**
 * Formata telefone brasileiro com DDD: (11) 98765-4321 ou (11) 3456-7890
 */
export function formatPhone(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Calcula a idade automaticamente com base na data de nascimento (YYYY-MM-DD ou Date)
 */
export function calculateAge(birthDateInput?: string | Date | null | unknown): number | null {
  if (!birthDateInput) return null;

  try {
    const birthDate =
      birthDateInput instanceof Date || Object.prototype.toString.call(birthDateInput) === '[object Date]'
        ? (birthDateInput as Date)
        : new Date(String(birthDateInput));

    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 && age < 130 ? age : null;
  } catch {
    return null;
  }
}

export interface IMCResult {
  imc: number;
  label: string;
  colorClass: string;
  bgClass: string;
}

/**
 * Calcula o Índice de Massa Corporal (IMC) a partir do peso em kg e altura em cm (ou metros)
 */
export function calculateIMC(
  pesoKg?: number | string | null,
  alturaCm?: number | string | null
): IMCResult | null {
  if (!pesoKg || !alturaCm) return null;

  const peso = typeof pesoKg === 'number' ? pesoKg : parseFloat(String(pesoKg).replace(',', '.'));
  let altura = typeof alturaCm === 'number' ? alturaCm : parseFloat(String(alturaCm).replace(',', '.'));

  if (isNaN(peso) || isNaN(altura) || peso <= 0 || altura <= 0) return null;

  // Se a altura for informada em centímetros (ex: 170), converte para metros (1.70)
  if (altura > 3) {
    altura = altura / 100;
  }

  const imcRaw = peso / (altura * altura);
  if (isNaN(imcRaw) || !isFinite(imcRaw) || imcRaw <= 0 || imcRaw > 100) return null;

  const imc = parseFloat(imcRaw.toFixed(1));

  if (imc < 18.5) {
    return {
      imc,
      label: 'Abaixo do peso',
      colorClass: 'text-amber-800',
      bgClass: 'bg-amber-100 border-amber-300',
    };
  } else if (imc < 25.0) {
    return {
      imc,
      label: 'Peso adequado (normal)',
      colorClass: 'text-emerald-800',
      bgClass: 'bg-emerald-100 border-emerald-300',
    };
  } else if (imc < 30.0) {
    return {
      imc,
      label: 'Sobrepeso',
      colorClass: 'text-orange-800',
      bgClass: 'bg-orange-100 border-orange-300',
    };
  } else if (imc < 35.0) {
    return {
      imc,
      label: 'Obesidade Grau I',
      colorClass: 'text-red-700',
      bgClass: 'bg-red-100 border-red-300',
    };
  } else if (imc < 40.0) {
    return {
      imc,
      label: 'Obesidade Grau II',
      colorClass: 'text-red-800',
      bgClass: 'bg-red-200 border-red-400',
    };
  } else {
    return {
      imc,
      label: 'Obesidade Grau III',
      colorClass: 'text-red-900',
      bgClass: 'bg-red-300 border-red-500',
    };
  }
}

/**
 * Converte número digitado para formato de hora padrão HH:mm
 * Ex: 6 → "06:00", 630 → "06:30", 23 → "23:00", 2230 → "22:30"
 */
export function convertNumberToTimeString(value: string | number): string {
  if (value === undefined || value === null) return '';
  const str = String(value).trim();
  if (!str) return '';

  // Se já contém ':' no formato HH:mm
  if (str.includes(':')) {
    const parts = str.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const normH = h >= 24 ? 0 : Math.max(0, h);
    const normM = m >= 60 ? 59 : Math.max(0, m);
    return `${String(normH).padStart(2, '0')}:${String(normM).padStart(2, '0')}`;
  }

  const digits = str.replace(/\D/g, '');
  if (!digits) return '';

  let h = 0;
  let m = 0;

  if (digits.length === 1 || digits.length === 2) {
    h = parseInt(digits, 10);
    m = 0;
  } else if (digits.length === 3) {
    h = parseInt(digits.slice(0, 1), 10);
    m = parseInt(digits.slice(1, 3), 10);
  } else {
    h = parseInt(digits.slice(0, 2), 10);
    m = parseInt(digits.slice(2, 4), 10);
  }

  if (h === 24 && m === 0) {
    return '00:00';
  }
  if (h > 23) h = 23;
  if (m > 59) m = 59;

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Formata data no formato brasileiro DD/MM/YYYY
 * Suporta instâncias de Date, strings ISO (YYYY-MM-DD...), timestamps ou strings já formatadas.
 * Garante SEMPRE o retorno de uma string primitiva (nunca um objeto).
 */
export function formatDateBR(dateVal?: string | Date | null | unknown): string {
  if (!dateVal) return '';

  try {
    // Caso seja um objeto Date
    if (dateVal instanceof Date || Object.prototype.toString.call(dateVal) === '[object Date]') {
      const d = dateVal as Date;
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('pt-BR');
    }

    // Se for string ou outro tipo primitivo
    const dateStr = String(dateVal).trim();
    if (!dateStr || dateStr === 'null' || dateStr === 'undefined') return '';

    // Formatos como YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
    const dateOnly = dateStr.split('T')[0].split(' ')[0];
    const parts = dateOnly.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }

    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('pt-BR');
    }

    return dateStr;
  } catch {
    return '';
  }
}

/**
 * Converte data (Date, string ISO ou YYYY-MM-DD) para o formato esperado pelo <input type="date"> (YYYY-MM-DD)
 */
export function formatDateToInput(dateVal?: string | Date | null | unknown): string {
  if (!dateVal) return '';

  try {
    if (dateVal instanceof Date || Object.prototype.toString.call(dateVal) === '[object Date]') {
      const d = dateVal as Date;
      if (isNaN(d.getTime())) return '';
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const str = String(dateVal).trim();
    if (!str || str === 'null' || str === 'undefined') return '';

    const dateOnly = str.split('T')[0].split(' ')[0];
    const parts = dateOnly.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }

    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    return '';
  } catch {
    return '';
  }
}
