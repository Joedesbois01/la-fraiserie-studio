export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'RESEND_API_KEY is not configured' });

  try {
    const { to, subject, html, text, from } = req.body || {};
    if (!to || !subject || !html) return res.status(400).json({ error: 'to, subject and html are required' });
    const recipients = Array.isArray(to) ? to : [to];
    if (!recipients.length || recipients.length > 100) return res.status(400).json({ error: 'Recipient count must be between 1 and 100' });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: from || process.env.MAIL_FROM || 'La Fraiserie <onboarding@resend.dev>',
        to: recipients,
        subject,
        html,
        ...(text ? { text } : {})
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Resend rejected the message' });
    return res.status(200).json({ ok: true, id: data.id });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected error' });
  }
}
