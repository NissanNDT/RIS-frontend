const API_URL = "http://localhost:3000/api";

export const loginRequest = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include", // CLAVE: envía/recibe cookies httpOnly
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Credenciales inválidas");
  }

  return response.json();
};

/**
 * Cierra sesión en el backend para que elimine la cookie httpOnly del token.
 * También limpia el localStorage del lado del cliente.
 */
export const logoutRequest = async () => {
  try {
    await fetch(`${API_URL}/logout`, {
      method: "POST",
      credentials: "include", // CLAVE: envía la cookie para que el backend la invalide
    });
  } catch {
    // Si el backend no responde, el logout del cliente continúa de todas formas
  } finally {
    localStorage.removeItem("user");
  }
};