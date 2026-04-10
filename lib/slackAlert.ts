/**
 * Disparador de Webhooks Customizados do Slack.
 * Faz POST no endpoint nativo com o formato Block Kit Builder do App Slack.
 */
export async function sendSlackWebhook(webhookUrl: string | null, action: string, severity: 'INFO' | 'WARNING' | 'HIGH', metadata: any) {
  if (!webhookUrl) return;

  const color = severity === 'HIGH' ? '#ef4444' : severity === 'WARNING' ? '#eab308' : '#22c55e'
  const emoji = severity === 'HIGH' ? '🚨' : severity === 'WARNING' ? '⚠️' : '✅'

  const payload = {
    attachments: [
      {
        color,
        blocks: [
          { 
            type: 'header', 
            text: { type: 'plain_text', text: `${emoji} Sky-Contability SecOps` } 
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Severidade:*\n${severity}` },
              { type: 'mrkdwn', text: `*Ação Excutada:*\n\`${action}\`` },
              { type: 'mrkdwn', text: `*User ID / Conta:*\n${metadata.userId}` },
              { type: 'mrkdwn', text: `*IP Gateway:*\n${metadata.ip || 'N/A'}` }
            ]
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Gerado via Alertas Automatizados às ${new Date().toISOString()}`
              }
            ]
          }
        ]
      }
    ]
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    console.error('[Sky-Contabilidade] Falha silenciosa de Slack Webhook via API:', e)
  }
}
