const API_URL = "http://localhost:3000/api"; 

export const loginRequest = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Credenciales inválidas");
  }

  return response.json();
};
