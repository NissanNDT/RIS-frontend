export const getToken = () => {
  return localStorage.getItem("token");
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const getUserId = () => {
  const user = getUserFromToken();
  return user?.id;
};