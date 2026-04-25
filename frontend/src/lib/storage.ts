const LEGACY_TOKEN_KEY = "trainity_token";
const TOKEN_KEY = "vittra_token";

export const storage = {
  getToken: () =>
    localStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(LEGACY_TOKEN_KEY),
  setToken: (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(LEGACY_TOKEN_KEY, token);
  },
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  },
};
