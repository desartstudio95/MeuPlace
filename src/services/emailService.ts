import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Service to handle transactional emails.
 * In a real Firebase environment, this relies on the "Trigger Email" extension.
 * When a document is written to the "mail" collection, the extension picks it up 
 * and sends the email via SendGrid, Nodemailer, etc.
 */
export const emailService = {
  /**
   * Sends a generic email by writing to the "mail" collection.
   */
  async sendEmail(to: string | string[], subject: string, html: string) {
    try {
      await addDoc(collection(db, 'mail'), {
        to,
        message: {
          subject,
          html,
        },
        createdAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      return false;
    }
  },

  /**
   * Sends a welcome email for newly registered users.
   */
  async sendWelcomeEmail(to: string, name: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h1 style="color: #4CAF50; text-align: center;">Bem-vindo ao MeuPlace!</h1>
        <p>Olá <b>${name}</b>,</p>
        <p>Estamos muito felizes em tê-lo conosco no maior portal imobiliário de Moçambique.</p>
        <p>Aqui você poderá:</p>
        <ul>
          <li>Explorar as melhores propriedades do país</li>
          <li>Entrar em contato direto com os agentes e agências</li>
          <li>Salvar seus imóveis favoritos</li>
        </ul>
        <p>Se precisar de ajuda para começar, não hesite em entrar em contato com nossa equipe de suporte!</p>
        <br/>
        <p>Abraços,</p>
        <p><b>Equipe MeuPlace</b></p>
      </div>
    `;
    return this.sendEmail(to, 'Bem-vindo ao MeuPlace!', html);
  },

  /**
   * Sends an email notification to an agent about a new message from a client.
   */
  async sendNewMessageNotification(to: string, senderName: string, senderEmail: string, propertyTitle: string, messagePreview: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333 border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #FF9800; border-bottom: 1px solid #eee; padding-bottom: 10px;">Nova Mensagem Recebida</h2>
        <p>Olá,</p>
        <p>Você recebeu uma nova mensagem sobre o seu anúncio: <b>${propertyTitle}</b>.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #FF9800; margin: 20px 0;">
          <p style="margin-top: 0;"><b>De:</b> ${senderName} (${senderEmail})</p>
          <p style="margin-bottom: 0;"><i>"${messagePreview}"</i></p>
        </div>
        <p>Acesse o seu painel de controle (Dashboard) no MeuPlace para responder ao cliente o mais rápido possível e não perder a oportunidade de negócio.</p>
        <p>Sucesso nas vendas!</p>
        <p><b>Equipe MeuPlace</b></p>
      </div>
    `;
    return this.sendEmail(to, `Nova mensagem no MeuPlace - ${propertyTitle}`, html);
  },

  /**
   * Confirmation email sent to the user when they submit a contact form on a property.
   */
  async sendContactConfirmation(to: string, propertyTitle: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2 style="color: #4CAF50;">Mensagem Enviada com Sucesso!</h2>
        <p>Sua mensagem sobre o imóvel <b>${propertyTitle}</b> foi enviada ao anunciante.</p>
        <p>O agente imobiliário responsável entrará em contato em breve através do seu email ou telefone fornecido.</p>
        <p>Obrigado por utilizar o MeuPlace!</p>
      </div>
    `;
    return this.sendEmail(to, `Mensagem enviada - ${propertyTitle}`, html);
  },

  /**
   * System contact generic emails.
   */
  async sendAdminContactNotification(name: string, email: string, phone: string, message: string) {
    const adminEmail = 'contacto@meuplace.co.mz'; // Default admin email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <h2>Nova Submissão no Formulário de Contato do Portal</h2>
        <p><b>Nome:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Telefone:</b> ${phone || 'Não informado'}</p>
        <br/>
        <p><b>Mensagem:</b></p>
        <div style="background-color: #f5f5f5; padding: 15px;">
           <p>${message}</p>
        </div>
      </div>
    `;
    return this.sendEmail(adminEmail, `Novo Contato via Website: ${name}`, html);
  }
};
