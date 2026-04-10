export function getSecurityAlertEmailHtml(action: string, ip: string, device: string, time: string) {
  // Retorna um HTML Responsivo de Padrão Corporativo para E-mails Transacionais (Resend / SendGrid)
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
      <div style="background-color: #ef4444; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">🛡️ Alerta Crítico Sky-Contability</h2>
      </div>
      <div style="padding: 30px; background-color: #f8fafc; color: #334155;">
        <p style="font-size: 16px;">Detectamos uma atividade de risco ou reconfiguração de segurança vital na sua conta:</p>
        <ul style="background: white; padding: 20px; border-radius: 6px; border: 1px solid #cbd5e1; list-style: none;">
          <li style="margin-bottom: 12px;"><strong>Evento (Ação):</strong> <span style="color: #ef4444; font-weight: bold;">${action}</span></li>
          <li style="margin-bottom: 12px;"><strong>Endereço de IP:</strong> <span style="font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${ip}</span></li>
          <li style="margin-bottom: 12px;"><strong>Aparelho / Navegador:</strong> ${device}</li>
          <li><strong>Data e Horário (Local):</strong> ${time}</li>
        </ul>
        <p style="margin-top: 25px; font-size: 14px; color: #64748b;">
          Se foi você quem fez isso, pode ignorar este e-mail. Caso contrário, tome uma ação imediatamente.
        </p>
        <div style="margin-top: 30px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/auth/lockdown" style="background-color: #0f172a; color: white; padding: 14px 28px; text-decoration: none; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);">Não fui eu — Bloquear Acesso/Senha Agora</a>
        </div>
      </div>
      <div style="padding: 15px; text-align: center; background: #f1f5f9; font-size: 12px; color: #94a3b8;">
        Sky-Contability © ${new Date().getFullYear()} - Sistema Automatizado de Detecção Zero-Trust.
      </div>
    </div>
  `
}
