import axios from "axios";

const Instance = axios.create({
  baseURL: "http://192.168.11.245:5000/api",
  // baseURL: "https://kavach-pdf-tools-auth.onrender.com/api",

  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // if using cookies
});

// 🔥 Add token before each request
Instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔥 Handle unauthorized error globally
Instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Token expired. Logging out...");
      localStorage.removeItem("authToken");
      window.location.href = "/login"; 
    }
    return Promise.reject(error);
  }
);

export default Instance;
