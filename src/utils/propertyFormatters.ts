/**
 * Formatadores e validadores utilitários para propriedades do MeuPlace
 */

/**
 * Formata o preço com separador de milhares em português de Moçambique
 * e sufixo '/ mês' quando for arrendamento.
 */
export function formatPropertyPrice(
  price: number | undefined | null,
  currency: string = 'MZN',
  type?: string
): string {
  if (typeof price !== 'number' || isNaN(price) || price < 0) {
    return 'Sob consulta';
  }

  const formatted = price.toLocaleString('pt-MZ');
  const curr = currency || 'MZN';
  const isRent = type === 'Arrendamento' || type === 'rent';

  return `${curr} ${formatted}${isRent ? ' / mês' : ''}`;
}

/**
 * Verifica se um imóvel foi cadastrado recentemente (ex: últimos 14 dias)
 * de forma resiliente a Timestamp do Firestore, string ISO ou timestamp numérico.
 */
export function isRecentProperty(createdAt: any, maxDays: number = 14): boolean {
  if (!createdAt) return false;
  try {
    let date: Date | null = null;

    if (typeof createdAt?.toDate === 'function') {
      date = createdAt.toDate();
    } else if (createdAt?.seconds && typeof createdAt.seconds === 'number') {
      date = new Date(createdAt.seconds * 1000);
    } else if (typeof createdAt === 'string' || typeof createdAt === 'number') {
      date = new Date(createdAt);
    }

    if (!date || isNaN(date.getTime())) return false;

    const diffMs = Date.now() - date.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffDays >= 0 && diffDays <= maxDays;
  } catch {
    return false;
  }
}

/**
 * Normaliza o tipo de transação para apresentação legível
 */
export function formatTransactionType(type?: string): 'Venda' | 'Arrendamento' {
  if (type === 'rent' || type === 'Arrendamento') return 'Arrendamento';
  return 'Venda';
}
