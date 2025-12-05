import { apiClient, setTokens, clearTokens, getRefreshToken } from './client';

export interface User {
  id: number;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface MessageResponse {
  message: string;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const data = await apiClient<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setTokens(data.access_token, data.refresh_token);
  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  try {
    await apiClient<MessageResponse>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
      skipAuth: true,
    });
  } finally {
    clearTokens();
  }
}

export async function logoutAll(): Promise<MessageResponse> {
  const data = await apiClient<MessageResponse>('/auth/logout-all', {
    method: 'POST',
  });
  clearTokens();
  return data;
}

export async function getCurrentUser(): Promise<User> {
  return apiClient<User>('/auth/me');
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<MessageResponse> {
  const data = await apiClient<MessageResponse>('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
  clearTokens();
  return data;
}
