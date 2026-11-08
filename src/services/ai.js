const API = import.meta.env.VITE_AI_API_URL || 'http://localhost:5000';

export async function predictPrice(payload) {
  try {
    const res = await fetch(`${API}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`AI ${res.status}`);
    return res.json();
  } catch (err) {
    console.warn('AI predict failed:', err.message);
    return null;
  }
}

export async function fetchAIMetrics() {
  try {
    const res = await fetch(`${API}/metrics`);
    if (!res.ok) throw new Error(`AI ${res.status}`);
    return res.json();
  } catch (err) {
    console.warn('AI metrics failed:', err.message);
    return null;
  }
}

export async function fetchPredictions() {
  try {
    const res = await fetch(`${API}/predictions`);
    return res.json();
  } catch {
    return [];
  }
}
export async function askAiChat(message) {
  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();
    return data.reply;
  } catch (err) {
    console.warn('AI Chat failed:', err);
    return "I am currently offline. Please try again later.";
  }
}