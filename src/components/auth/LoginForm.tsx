import React, { useState } from 'react';
import { Mail, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { loginNutricionista } from '@/lib/neon-auth';
import type { NutricionistaUser } from '@/types/auth';

interface LoginFormProps {
  onSuccess: (user: NutricionistaUser) => void;
  onNavigateToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateToRegister,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Por favor, informe seu e-mail.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor, informe sua senha.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginNutricionista(email, password);

      if (result.success && result.user) {
        onSuccess(result.user);
      } else {
        setErrorMessage(
          result.error ||
            'Não foi possível entrar. Verifique seu e-mail e senha e tente novamente.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Ocorreu uma falha na conexão. Tente novamente em instantes.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-slide-up">
      {/* Logotipo NutriOn no topo */}
      <div className="mb-8">
        <Logo size="lg" showSubtitle={true} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo(a) de volta</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar sua área clínica e gerenciar seus pacientes.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent>
            {errorMessage && (
              <Alert
                variant="error"
                title="Não foi possível entrar"
                message={errorMessage}
                onClose={() => setErrorMessage(null)}
              />
            )}

            {/* Campo de e-mail */}
            <Input
              id="login-email"
              name="email"
              type="email"
              label="E-mail profissional"
              placeholder="dra.exemplo@nutrion.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={isLoading}
              leftIcon={<Mail className="w-4 h-4 text-[#7A6963]" />}
            />

            {/* Campo de senha */}
            <PasswordInput
              id="login-password"
              name="password"
              label="Senha"
              placeholder="Digite sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={isLoading}
            />

            {/* Botão Entrar */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<LogIn className="w-4 h-4" />}
              >
                Entrar
              </Button>
            </div>
          </CardContent>

          {/* Link para cadastro */}
          <CardFooter>
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-[#7A6963]">
                Não tem conta?{' '}
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="font-semibold text-[#B97F74] hover:text-[#935A50] hover:underline cursor-pointer transition-colors inline-flex items-center gap-1"
                >
                  Cadastre-se
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-[#7A6963]/80">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Autenticação segura via Neon Auth</span>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
