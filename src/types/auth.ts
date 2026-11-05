export interface NutricionistaUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  image?: string | null;
}

export interface NutricionistaProfile {
  id: string;
  nome: string;
  email: string;
  created_at?: string;
}

export interface AuthSession {
  user: NutricionistaUser;
  token?: string;
  expiresAt?: string;
}

export interface AuthResult {
  success: boolean;
  user?: NutricionistaUser;
  error?: string;
}
