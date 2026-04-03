export default async function handler(req, res) {
    // Hanya izinkan method POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt, data } = req.body;
    
    // Mengambil API Key dari Environment Variable Vercel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API Key belum di-setting di Vercel.' });
    }

    // System prompt dipindah ke backend agar aman dan tidak bisa dimanipulasi user
    const systemPrompt = `Kamu adalah Senior System Analyst. Manipulasi data berikut sesuai instruksi.
ATURAN STRICT: Jawab HANYA berupa raw JSON object dengan struktur:
{
  "filename": "nama_file_relevan.xlsx",
  "summary": "Penjelasan singkat perubahan data.",
  "data": [ ["Header1", "Header2"], ["Val1", "Val2"] ]
}
DILARANG menambahkan teks markdown, backtick, atau apapun selain raw JSON.

Instruksi: ${prompt}
Data: ${JSON.stringify(data)}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        });

        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error?.message || "Kesalahan API Google.");
        }

        // Kembalikan hasil ke frontend
        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}