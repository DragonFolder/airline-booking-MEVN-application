import axios from "axios";


const api = axios.create({
	// use env var when provided, otherwise default to localhost:3000
	baseURL: import.meta.env.VITE_E_COMMERSE_API || 'http://localhost:4000'
});


api.interceptors.request.use((config) => {

	const token = localStorage.getItem("token");

	if(token) {

		config.headers.Authorization = `Bearer ${token}`;
	}

	return config
});

export default api;