import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const registerUser = (userData) => axios.post(`${API_URL}/auth/register`, userData);
export const loginUser = (userData) => axios.post(`${API_URL}/auth/login`, userData);
export const sendMessage = (token,userId, message) =>axios.post(`${API_URL}/chat/message`, { message,userId }, { headers: { Authorization: token } });

// affirmations routes -> AffirmationMirror.jsx
export const getAffirmations = (mood, token) => axios.get(`${API_URL}/affirmations/${mood}`, { headers: { Authorization: token } });
export const postGeminiMoodAnalysis = (text, token) => axios.post(`${API_URL}/affirmations/gemini-mood`, { text }, { headers: { Authorization: token } });
export const postGeminiTextSimilarity = (spokenText, expectedText, token) => axios.post(`${API_URL}/affirmations/gemini-text-similarity`, { spokenText, expectedText }, { headers: { Authorization: token } });
