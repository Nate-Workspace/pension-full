export type Role = "admin" | "staff";

export interface User {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}