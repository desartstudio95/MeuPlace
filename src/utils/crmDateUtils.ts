/**
 * MEUPLACE — CRM V1: DATE & TIMEZONE UTILITIES
 * 
 * Fuso Horário de Moçambique: CAT (Central Africa Time / Africa/Maputo = UTC+2).
 * Não há horário de verão em Moçambique.
 * 
 * Este utilitário padroniza:
 * 1. Conversão de Timestamps do Firestore, strings ISO e objetos Date para UTC/CAT.
 * 2. Cálculo determinístico de limites diários inclusivos (startOfPeriod: 00:00:00.000, endOfPeriod: 23:59:59.999).
 * 3. Geração de intervalos para agrupamento de tendência (diário / semanal).
 * 4. Operações matemáticas seguras para percentagens (sempre prevenindo NaN / Infinity / Divisão por Zero).
 */

export const MOZAMBIQUE_TIMEZONE = 'Africa/Maputo';
export const MOZAMBIQUE_UTC_OFFSET_HOURS = 2; // CAT é UTC+2 constante

export type CrmDatePreset = '7d' | '30d' | '90d' | 'custom' | 'all';

/**
 * Converte qualquer formato de data (Firestore Timestamp, Date, string ISO, timestamp numérico) em Date válido.
 * Retorna null se for inválido ou indefinido.
 */
export function parseToDate(input: any): Date | null {
  if (!input) return null;

  if (typeof input.toDate === 'function') {
    try {
      return input.toDate();
    } catch {
      return null;
    }
  }

  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input;
  }

  if (typeof input === 'number') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  if (typeof input === 'string') {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Constrói um Date com base no fuso horário de Moçambique (UTC+2).
 * Converte data local de Moçambique (ano, mês 0-11, dia, horas, minutos, segundos, ms)
 * para o instante exato em UTC.
 */
export function createMozambiqueDate(
  year: number,
  monthIndex: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  ms = 0
): Date {
  // CAT é UTC+2: horários em CAT equivalem a UTC (horas - 2)
  return new Date(Date.UTC(year, monthIndex, day, hours - MOZAMBIQUE_UTC_OFFSET_HOURS, minutes, seconds, ms));
}

/**
 * Retorna os componentes de data (ano, mês, dia) no fuso horário de Moçambique.
 */
export function getMozambiqueDateComponents(date: Date): {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  // Adiciona o offset de +2 horas ao UTC para obter componentes locais de Moçambique
  const catEpoch = date.getTime() + MOZAMBIQUE_UTC_OFFSET_HOURS * 60 * 60 * 1000;
  const catDate = new Date(catEpoch);

  return {
    year: catDate.getUTCFullYear(),
    month: catDate.getUTCMonth(),
    day: catDate.getUTCDate(),
    hours: catDate.getUTCHours(),
    minutes: catDate.getUTCMinutes(),
    seconds: catDate.getUTCSeconds()
  };
}

/**
 * Retorna o início do dia (00:00:00.000) no fuso de Moçambique.
 */
export function startOfDayMozambique(date: Date): Date {
  const { year, month, day } = getMozambiqueDateComponents(date);
  return createMozambiqueDate(year, month, day, 0, 0, 0, 0);
}

/**
 * Retorna o fim do dia (23:59:59.999) no fuso de Moçambique.
 */
export function endOfDayMozambique(date: Date): Date {
  const { year, month, day } = getMozambiqueDateComponents(date);
  return createMozambiqueDate(year, month, day, 23, 59, 59, 999);
}

/**
 * Calcula os limites temporais (início e fim) de acordo com o preset selecionado.
 */
export function getDateRangeBoundaries(
  preset: CrmDatePreset,
  customStart?: string,
  customEnd?: string,
  nowReference: Date = new Date()
): { startDate: Date; endDate: Date; label: string } {
  const endOfToday = endOfDayMozambique(nowReference);

  switch (preset) {
    case '7d': {
      // Últimos 7 dias (incluindo hoje): subtrai 6 dias do início de hoje
      const { year, month, day } = getMozambiqueDateComponents(nowReference);
      const start = createMozambiqueDate(year, month, day - 6, 0, 0, 0, 0);
      return {
        startDate: start,
        endDate: endOfToday,
        label: 'Últimos 7 Dias'
      };
    }

    case '30d': {
      const { year, month, day } = getMozambiqueDateComponents(nowReference);
      const start = createMozambiqueDate(year, month, day - 29, 0, 0, 0, 0);
      return {
        startDate: start,
        endDate: endOfToday,
        label: 'Últimos 30 Dias'
      };
    }

    case '90d': {
      const { year, month, day } = getMozambiqueDateComponents(nowReference);
      const start = createMozambiqueDate(year, month, day - 89, 0, 0, 0, 0);
      return {
        startDate: start,
        endDate: endOfToday,
        label: 'Últimos 90 Dias'
      };
    }

    case 'custom': {
      if (customStart && customEnd) {
        const startParsed = parseToDate(customStart);
        const endParsed = parseToDate(customEnd);

        if (startParsed && endParsed) {
          const s = startOfDayMozambique(startParsed);
          const e = endOfDayMozambique(endParsed);
          // Garante ordem cronológica
          if (s <= e) {
            return {
              startDate: s,
              endDate: e,
              label: `Personalizado (${formatDateMozambique(s)} a ${formatDateMozambique(e)})`
            };
          }
        }
      }
      // Fallback para 30 dias se os parâmetros customizados forem inválidos
      const { year, month, day } = getMozambiqueDateComponents(nowReference);
      return {
        startDate: createMozambiqueDate(year, month, day - 29, 0, 0, 0, 0),
        endDate: endOfToday,
        label: 'Últimos 30 Dias (Padrão)'
      };
    }

    case 'all':
    default: {
      // Marco zero do projeto: 01 de Janeiro de 2024
      const epochStart = createMozambiqueDate(2024, 0, 1, 0, 0, 0, 0);
      return {
        startDate: epochStart,
        endDate: endOfToday,
        label: 'Todo o Histórico'
      };
    }
  }
}

/**
 * Verifica se uma data qualquer está contida dentro do intervalo inclusivo [startDate, endDate].
 */
export function isWithinDateRange(
  dateInput: any,
  startDate: Date,
  endDate: Date
): boolean {
  const d = parseToDate(dateInput);
  if (!d) return false;
  const time = d.getTime();
  return time >= startDate.getTime() && time <= endDate.getTime();
}

/**
 * Formata data no formato Moçambicano (DD/MM/YYYY).
 */
export function formatDateMozambique(input: any): string {
  const d = parseToDate(input);
  if (!d) return '--';
  const { day, month, year } = getMozambiqueDateComponents(d);
  const dd = String(day).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  return `${dd}/${mm}/${year}`;
}

/**
 * Formata data e hora no formato Moçambicano (DD/MM/YYYY às HH:mm).
 */
export function formatDateTimeMozambique(input: any): string {
  const d = parseToDate(input);
  if (!d) return '--';
  const { day, month, year, hours, minutes } = getMozambiqueDateComponents(d);
  const dd = String(day).padStart(2, '0');
  const mm = String(month + 1).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');
  return `${dd}/${mm}/${year} às ${hh}:${min}`;
}

/**
 * Estrutura de intervalo para os pontos do gráfico de tendência.
 */
export interface TrendInterval {
  key: string;       // chave única (ex: '2026-09-25')
  label: string;     // texto amigável de exibição (ex: '25/09' ou 'Sem 38')
  fullDate: string;  // string legível
  start: Date;       // limite inferior inclusivo
  end: Date;         // limite superior inclusivo
}

/**
 * Gera intervalos contínuos e discretos para o gráfico de tendência.
 * 7d / 30d -> intervalos diários
 * 90d -> intervalos semanais
 */
export function generateTrendIntervals(
  preset: CrmDatePreset,
  startDate: Date,
  endDate: Date
): TrendInterval[] {
  const intervals: TrendInterval[] = [];
  const diffDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));

  if (preset === '90d' || diffDays > 45) {
    // Agrupamento semanal (blocos de 7 dias)
    let currentStart = new Date(startDate.getTime());
    let weekIndex = 1;

    while (currentStart <= endDate) {
      const currentEnd = new Date(
        Math.min(endDate.getTime(), currentStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
      );

      const label = `Sem ${weekIndex} (${formatDateMozambique(currentStart).slice(0, 5)})`;
      intervals.push({
        key: `week_${weekIndex}_${currentStart.toISOString().slice(0, 10)}`,
        label,
        fullDate: `${formatDateMozambique(currentStart)} a ${formatDateMozambique(currentEnd)}`,
        start: currentStart,
        end: currentEnd
      });

      // Avança 7 dias
      currentStart = new Date(currentStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      weekIndex++;
    }
  } else {
    // Agrupamento diário
    let cursor = new Date(startDate.getTime());

    while (cursor <= endDate) {
      const dayStart = startOfDayMozambique(cursor);
      const dayEnd = endOfDayMozambique(cursor);

      const { day, month } = getMozambiqueDateComponents(cursor);
      const dayLabel = `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`;
      const isoKey = dayStart.toISOString().slice(0, 10);

      intervals.push({
        key: isoKey,
        label: dayLabel,
        fullDate: formatDateMozambique(cursor),
        start: dayStart,
        end: dayEnd
      });

      // Avança 1 dia
      cursor = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 + 1000); // 1s após a virada do dia
    }
  }

  return intervals;
}

/**
 * Cálculo matemático estritamente seguro de percentagem.
 * Garante que:
 * - Divisão por zero retorna null
 * - NaN retorna null
 * - Infinity retorna null
 * - Resultado possui 1 casa decimal (ex: 25.5%)
 */
export function safePercentage(numerator: number, denominator: number): number | null {
  if (
    typeof numerator !== 'number' ||
    typeof denominator !== 'number' ||
    isNaN(numerator) ||
    isNaN(denominator) ||
    denominator <= 0 ||
    !isFinite(numerator) ||
    !isFinite(denominator)
  ) {
    return null;
  }

  const raw = (numerator / denominator) * 100;
  if (isNaN(raw) || !isFinite(raw)) {
    return null;
  }

  return Math.round(raw * 10) / 10;
}

/**
 * Divisão segura simples. Retorna null se denominador for <= 0.
 */
export function safeDivision(numerator: number, denominator: number): number | null {
  if (
    typeof numerator !== 'number' ||
    typeof denominator !== 'number' ||
    isNaN(numerator) ||
    isNaN(denominator) ||
    denominator <= 0 ||
    !isFinite(numerator) ||
    !isFinite(denominator)
  ) {
    return null;
  }

  return numerator / denominator;
}
