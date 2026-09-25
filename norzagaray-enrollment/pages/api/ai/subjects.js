import { GoogleGenAI, Type } from '@google/genai';
import { readSession } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const subjectSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      code: { type: Type.STRING },
      title: { type: Type.STRING },
      units: { type: Type.INTEGER },
      department: { type: Type.STRING },
      yearLevel: { type: Type.INTEGER },
      section: { type: Type.STRING },
      room: { type: Type.STRING },
      day: { type: Type.STRING },
      time: { type: Type.STRING },
    },
    required: ['code', 'title', 'units'],
  },
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export const config = { api: { bodyParser: { sizeLimit: '64mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const session = readSession(req);
  const user = session ? await prisma.user.findUnique({ where: { id: session.userId }, select: { role: true } }) : null;
  if (!user || user.role !== 'ADVISER') return res.status(403).json({ error: 'Only professors can scan subject images.' });
  if (!ai) return res.status(503).json({ error: 'AI scanning is not configured. Add GEMINI_API_KEY first.' });

  const images = Array.isArray(req.body?.images) ? req.body.images : [];
  if (!images.length) return res.status(400).json({ error: 'Add at least one subject image.' });
  if (images.length > 8) return res.status(400).json({ error: 'Scan up to 8 images at a time.' });
  if (images.some((image) => !image?.mimeType?.startsWith('image/') || !image?.data)) return res.status(400).json({ error: 'Each selected file must be a readable image.' });

  try {
    const contents = [
      { text: 'Extract every academic subject visible in these images. Return only the JSON array. Normalize the department to one of BEED, BSED, BSHM, BSCS, ACT when clear, and leave unknown optional fields as empty strings. Do not invent values.' },
      ...images.map((image) => ({ inlineData: { mimeType: image.mimeType, data: image.data } })),
    ];
    let response;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents, config: { responseMimeType: 'application/json', responseSchema: subjectSchema } });
        break;
      } catch (error) {
        if (attempt === 1 || !String(error.message).includes('high demand')) throw error;
        await wait(1200);
      }
    }
    const responseText = typeof response.text === 'function' ? response.text() : response.text;
    const subjects = JSON.parse(responseText || '[]');
    if (!Array.isArray(subjects)) throw new Error('The AI returned an invalid subject list.');
    return res.status(200).json({ subjects: subjects.map((subject) => ({ ...subject, units: Number(subject.units) || 3, yearLevel: Number(subject.yearLevel) || 1 })) });
  } catch (error) {
    console.error('Subject image scan failed:', error);
    const temporary = String(error.message).includes('high demand') || error.status === 503;
    return res.status(temporary ? 503 : 502).json({ error: temporary ? 'Gemini is temporarily busy. Please wait a moment and scan the photos again.' : `Could not read the subject images. ${error.message || 'Check the Gemini API key and try again.'}` });
  }
}
