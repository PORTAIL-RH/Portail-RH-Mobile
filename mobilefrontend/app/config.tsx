// config.ts
export const API_CONFIG = {
    BASE_URL: "http://localhost:8080", // Default base URL
    PORT: "8080", // Default port
  };
  
  export const setApiConfig = (baseUrl: string, port: string) => {
    API_CONFIG.BASE_URL = baseUrl;
    API_CONFIG.PORT = port;
  };   
