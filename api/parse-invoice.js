export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfBase64 } = req.body;
    if (!pdfBase64) return res.status(400).json({ error: 'No PDF data' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 }
            },
            {
              type: 'text',
              text: 'Extract from this Webmax Sales Invoice and return ONLY valid JSON no markdown:\n{"dealerName":"company from Bill To","dealerAddr":"full address lines joined with \\n","dealerTel":"phone number","date":"YYYY-MM-DD from Bill Date","tyres":[{"size":"eg 215/45R17","qty":2}]}\nFor tyre size extract from TYRE description lines, format as WIDTH/ASPECTRXX eg 215/45R17. Qty is number before PC/PCS. Empty string if not found.'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
