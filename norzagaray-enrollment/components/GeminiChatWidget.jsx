import React, { useState } from 'react';

export default function GeminiChatWidget({ studentContext, onAutoPopulate }) {
  const role = studentContext?.role || 'student';
  const greeting = role === 'administrator'
    ? 'Hi! Ask about account approvals, subject requests, or enrollment operations.'
    : role === 'professor'
      ? 'Hi! Ask about your department subjects, schedules, or enrollment records.'
      : 'Hi! Ask me to generate a schedule or explain your enrollment subjects.';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: greeting }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, studentContext })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'The assistant could not respond.');
      setMessages((prev) => [...prev, { sender: 'bot', text: data.reply || data.error || 'No response received.' }]);

      if (data.autoPopulateData && onAutoPopulate) {
        onAutoPopulate(data.autoPopulateData);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'bot', text: err.message || 'Error processing request.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg font-semibold hover:bg-blue-700 transition-all"
      >
        💬 {isOpen ? 'Close Chat' : 'Ask Gemini AI'}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 md:w-96 bg-white border rounded-xl shadow-2xl h-[450px] flex flex-col overflow-hidden">
          <div className="bg-blue-600 text-white p-3 font-semibold">Gemini AI Assistant</div>
          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gray-50">
            {messages.map((m, i) => (
              <div key={i} className={`p-2.5 rounded-lg text-sm max-w-[80%] ${m.sender === 'user' ? 'bg-blue-600 text-white ml-auto' : 'bg-white border text-gray-800'}`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="text-xs text-gray-500 italic">Assistant is thinking...</div>}
          </div>
          <form onSubmit={sendMessage} className="p-2 border-t flex gap-2 bg-white">
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. generate a morning schedule..." 
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none"
            />
            <button type="submit" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}