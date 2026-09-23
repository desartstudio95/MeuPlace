import { 
  collection, 
  addDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { PropertyReport, PropertyReportReason } from '@/types';

export interface CreateReportInput {
  propertyId: string;
  reason: PropertyReportReason;
  description: string;
  reporterEmail?: string;
  honeypot?: string;
}

export function validateReportInput(input: Partial<CreateReportInput>): { valid: boolean; error?: string } {
  if (input.honeypot && input.honeypot.trim().length > 0) {
    return { valid: false, error: 'Submissão bloqueada por filtro anti-bot.' };
  }

  if (!input.propertyId) return { valid: false, error: 'Imóvel inválido.' };
  
  const validReasons: PropertyReportReason[] = ['inexistent', 'wrong_price', 'wrong_location', 'inappropriate', 'duplicate', 'fraud', 'other'];
  if (!input.reason || !validReasons.includes(input.reason as PropertyReportReason)) {
    return { valid: false, error: 'Por favor selecione um motivo válido para a denúncia.' };
  }

  const desc = (input.description || '').trim();
  if (desc.length < 10) {
    return { valid: false, error: 'Por favor descreva o motivo com mais detalhes (mínimo 10 caracteres).' };
  }
  if (desc.length > 2000) {
    return { valid: false, error: 'A descrição excede o limite máximo permitido de 2000 caracteres.' };
  }

  return { valid: true };
}

export const reportService = {
  async submitReport(input: CreateReportInput): Promise<{ success: boolean; message: string }> {
    const validation = validateReportInput(input);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const desc = (input.description || '').trim();
    const currentUserId = auth.currentUser?.uid || 'anon_' + Date.now();
    const currentUserEmail = auth.currentUser?.email || input.reporterEmail?.trim();

    const reportData: Omit<PropertyReport, 'id'> = {
      propertyId: input.propertyId,
      reporterId: currentUserId,
      ...(currentUserEmail ? { reporterEmail: currentUserEmail } : {}),
      reason: input.reason,
      description: desc,
      status: 'open', // Status sempre inicial como 'open'
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'property_reports'), reportData);

    return {
      success: true,
      message: 'A sua denúncia foi enviada à nossa equipa de moderação para análise. Obrigado por ajudar a manter o MeuPlace seguro.'
    };
  }
};
