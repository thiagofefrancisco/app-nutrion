import { createAuthClient } from '@neondatabase/auth';
import { neon } from '@neondatabase/serverless';
import type { NutricionistaUser, NutricionistaProfile, AuthSession } from '@/types/auth';

// Neon Auth configuration
export const NEON_AUTH_URL =
  import.meta.env.VITE_NEON_AUTH_URL || '';

export const DATABASE_URL =
  import.meta.env.VITE_DATABASE_URL || '';

// Initialize the official Neon Auth client
export const neonAuthClient = createAuthClient(NEON_AUTH_URL);

// Initialize Neon Serverless SQL driver
export const sql = neon(DATABASE_URL);

const STORAGE_KEY_USER = 'nutrion_user_session';
const STORAGE_KEY_TOKEN = 'nutrion_auth_token';

/**
 * Normaliza mensagens de erro do Neon Auth em mensagens amigáveis em português
 */
export function formatAuthError(error: unknown): string {
  if (!error) return 'Ocorreu um erro inesperado. Tente novamente.';

  const errStr = typeof error === 'string' ? error : (error as any).message || (error as any).code || '';
  const errCode = (error as any).code || '';

  if (errStr.includes('Invalid email or password') || errCode === 'invalid_credentials') {
    return 'E-mail ou senha incorretos. Por favor, verifique suas credenciais e tente novamente.';
  }

  if (errStr.includes('already exists') || errStr.includes('duplicate key') || errCode === 'user_already_exists') {
    return 'Este e-mail já está cadastrado no sistema. Faça login com sua conta ou utilize outro e-mail.';
  }

  if (errStr.includes('at least 9') || errStr.includes('password') && errStr.includes('short')) {
    return 'A senha deve conter no mínimo 9 caracteres.';
  }

  if (errStr.includes('valid email') || errStr.includes('Invalid input') && errStr.includes('email')) {
    return 'Por favor, insira um endereço de e-mail válido.';
  }

  if (errStr.includes('Failed to fetch') || errStr.includes('NetworkError') || errStr.includes('connection')) {
    return 'Falha na conexão com o servidor de autenticação Neon. Verifique sua conexão com a internet.';
  }

  return errStr || 'Falha ao processar solicitação. Tente novamente em instantes.';
}

/**
 * Salva ou garante o cadastro do nutricionista na tabela `public.nutricionistas` do Neon
 */
export async function syncNutricionistaToDatabase(user: { id: string; name: string; email: string }): Promise<NutricionistaProfile | null> {
  try {
    // Upsert na tabela public.nutricionistas
    const rows = await sql.query(
      `INSERT INTO public.nutricionistas (id, nome, email)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET
         nome = EXCLUDED.nome
       RETURNING id, nome, email, created_at;`,
      [user.id, user.name, user.email.toLowerCase()]
    );

    if (rows && rows.length > 0) {
      return rows[0] as NutricionistaProfile;
    }
  } catch (err) {
    console.warn('[NutriOn] Fallback query para buscar nutricionista:', err);
    // Caso o trigger já tenha feito o insert
    try {
      const existing = await sql.query(
        `SELECT id, nome, email, created_at FROM public.nutricionistas WHERE email = $1 LIMIT 1;`,
        [user.email.toLowerCase()]
      );
      if (existing && existing.length > 0) {
        return existing[0] as NutricionistaProfile;
      }
    } catch (e) {
      console.error('[NutriOn] Erro ao sincronizar tabela nutricionistas:', e);
    }
  }
  return null;
}

/**
 * Busca perfil do nutricionista na tabela public.nutricionistas
 */
export async function getNutricionistaProfile(email: string): Promise<NutricionistaProfile | null> {
  try {
    const rows = await sql.query(
      `SELECT id, nome, email, created_at FROM public.nutricionistas WHERE email = $1 LIMIT 1;`,
      [email.toLowerCase()]
    );
    if (rows && rows.length > 0) {
      return rows[0] as NutricionistaProfile;
    }
  } catch (error) {
    console.error('[NutriOn] Erro ao buscar perfil na tabela nutricionistas:', error);
  }
  return null;
}

/**
 * Realiza o cadastro do nutricionista no Neon Auth
 * Regras:
 * - Senha com no mínimo 9 caracteres
 * - Salva nome e email na tabela `nutricionistas` do Neon
 */
export async function registerNutricionista(
  nome: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: NutricionistaUser; error?: string }> {
  // Validação prévia
  const trimmedName = nome.trim();
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName) {
    return { success: false, error: 'Por favor, informe seu nome completo.' };
  }

  if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
    return { success: false, error: 'Por favor, informe um endereço de e-mail válido.' };
  }

  if (password.length < 9) {
    return { success: false, error: 'A senha deve conter no mínimo 9 caracteres.' };
  }

  try {
    // Chamada ao endpoint Neon Auth (Better Auth)
    const response = await fetch(`${NEON_AUTH_URL}/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
        password: password,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.message || data?.error || 'Erro ao realizar cadastro';
      return { success: false, error: formatAuthError(msg) };
    }

    const authUser = data?.user || {
      id: data?.id || crypto.randomUUID(),
      name: trimmedName,
      email: trimmedEmail,
      createdAt: new Date().toISOString(),
    };

    const user: NutricionistaUser = {
      id: authUser.id,
      name: authUser.name || trimmedName,
      email: authUser.email || trimmedEmail,
      createdAt: authUser.createdAt || new Date().toISOString(),
    };

    // Garante que o nutricionista foi salvo na tabela public.nutricionistas
    await syncNutricionistaToDatabase({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    // Salva na sessão local para persistência garantida
    if (data?.token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
    }
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));

    return { success: true, user };
  } catch (error: any) {
    console.error('[NutriOn] Erro no cadastro:', error);
    return { success: false, error: formatAuthError(error) };
  }
}

/**
 * Realiza login do nutricionista no Neon Auth
 * Regras:
 * - Valida credenciais com o Neon Auth
 * - Se falhar, exibe mensagem clara e amigável
 * - Mantém sessão ativa
 */
export async function loginNutricionista(
  email: string,
  password: string
): Promise<{ success: boolean; user?: NutricionistaUser; error?: string }> {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    return { success: false, error: 'Por favor, informe seu e-mail.' };
  }

  if (!password) {
    return { success: false, error: 'Por favor, informe sua senha.' };
  }

  try {
    const response = await fetch(`${NEON_AUTH_URL}/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: trimmedEmail,
        password: password,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.message || data?.error || 'Credenciais inválidas';
      return { success: false, error: formatAuthError(msg) };
    }

    const authUser = data?.user;
    if (!authUser) {
      return { success: false, error: 'Não foi possível obter os dados do usuário. Tente novamente.' };
    }

    const user: NutricionistaUser = {
      id: authUser.id,
      name: authUser.name || trimmedEmail.split('@')[0],
      email: authUser.email || trimmedEmail,
      createdAt: authUser.createdAt,
    };

    // Atualiza/garante sincronização na tabela public.nutricionistas
    await syncNutricionistaToDatabase({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    // Salva na persistência do navegador
    if (data?.token) {
      localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
    }
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));

    return { success: true, user };
  } catch (error: any) {
    console.error('[NutriOn] Erro no login:', error);
    return { success: false, error: formatAuthError(error) };
  }
}

/**
 * Verifica se já existe sessão ativa (Neon Auth cookie ou persistência segura)
 * Garante que o nutricionista não precise fazer login toda vez que abrir o sistema
 */
export async function getActiveSession(): Promise<AuthSession | null> {
  // 1. Tenta verificar sessão via endpoint Neon Auth
  try {
    const response = await fetch(`${NEON_AUTH_URL}/get-session`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json().catch(() => null);
      if (data && data.user) {
        const user: NutricionistaUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          createdAt: data.user.createdAt,
        };
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
        return { user, token: data.session?.token };
      }
    }
  } catch (err) {
    console.warn('[NutriOn] Não foi possível verificar sessão remota, usando cache local:', err);
  }

  // 2. Fallback na persistência do localStorage
  try {
    const storedUser = localStorage.getItem(STORAGE_KEY_USER);
    const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN) || undefined;

    if (storedUser) {
      const user = JSON.parse(storedUser) as NutricionistaUser;
      if (user && user.email) {
        return { user, token: storedToken };
      }
    }
  } catch (err) {
    console.error('[NutriOn] Erro ao ler sessão do cache:', err);
  }

  return null;
}

/**
 * Encerra a sessão do nutricionista
 */
export async function logoutNutricionista(): Promise<void> {
  try {
    await fetch(`${NEON_AUTH_URL}/sign-out`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err) {
    console.warn('[NutriOn] Erro ao chamar sign-out no servidor:', err);
  } finally {
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }
}
