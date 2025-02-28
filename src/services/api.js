import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const registerUser = (userData) => axios.post(`${API_URL}/auth/register`, userData);
export const loginUser = (userData) => axios.post(`${API_URL}/auth/login`, userData);
export const sendMessage = (token,userId, message) =>axios.post(`${API_URL}/chat/message`, { message,userId }, { headers: { Authorization: token } });
