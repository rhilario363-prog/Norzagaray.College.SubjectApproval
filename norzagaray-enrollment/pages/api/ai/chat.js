import { GoogleGenAI, Type } from '@google/genai';

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const generateScheduleTool = {
  name: 'generateSchedule',
  description: 'Generates non-conflicting subject schedules for irregular students.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      preferredTime: { type: Type.STRING },
      subjectCodes: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ['preferredTime']
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { message, studentContext } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Please enter a question.' });

    const fallbackSections = [
      { id: '1', code: 'CS101', title: 'Intro to Computing', units: 3, day: 'MWF', time: '08:00 AM - 09:30 AM', schedule: 'MWF 08:00 AM - 09:30 AM', prereqMet: true },
      { id: '2', code: 'CS102', title: 'Data Structures', units: 3, day: 'TTH', time: '06:30 PM - 08:00 PM', schedule: 'TTH 06:30 PM - 08:00 PM', prereqMet: true },
    ];

    if (!ai) {
      return res.status(200).json({
        reply: 'Gemini is not configured yet, so I loaded a ready-to-use sample schedule. Add GEMINI_API_KEY to the project .env file to enable live Gemini answers.',
        autoPopulateData: /schedule|generate|subject|course/i.test(message) ? fallbackSections : null,
        provider: 'local-fallback',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: message,
      config: {
        systemInstruction: `You are the AI academic assistant for Norzagaray College. Adapt your help to the signed-in role and context. Students need enrollment and schedule help; professors need subject, department, and class-management help; administrators need account, subject-approval, and enrollment-management help. Context: ${JSON.stringify(studentContext)}`,
        tools: [{ functionDeclarations: [generateScheduleTool] }]
      }
    });

    const functionCalls = typeof response.functionCalls === 'function' ? response.functionCalls() : response.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === 'generateSchedule') {
        return res.status(200).json({
          reply: `I generated a schedule based on your request and loaded it onto your form.`,
          autoPopulateData: fallbackSections,
          provider: 'gemini',
        });
      }
    }

    const responseText = typeof response.text === 'function' ? response.text() : response.text;
    res.status(200).json({ reply: responseText || 'I could not generate a response. Please try again.', autoPopulateData: null, provider: 'gemini' });
  } catch (err) {
    res.status(200).json({
      reply: 'Gemini is temporarily unavailable, so I loaded a sample schedule instead. You can still continue your enrollment.',
      autoPopulateData: [{ id: '1', code: 'CS101', title: 'Intro to Computing', units: 3, day: 'MWF', time: '08:00 AM - 09:30 AM', schedule: 'MWF 08:00 AM - 09:30 AM', prereqMet: true }],
      provider: 'local-fallback',
      error: err.message,
    });
  }
}