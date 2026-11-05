import React, { useState } from 'react';
import { User, Mail, UserPlus, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { registerNutricionista } from '@/lib/neon-auth';
import type { NutricionistaUser } from '@/types/auth';

interface RegisterFormProps {
  onSuccess: (user: NutricionistaUser) => void;
  onNavigateToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validações
    if (!nome.trim()) {
      setErrorMessage('Por favor, informe seu nome completo.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    // Regra obrigatória: A senha deve ter no mínimo 9 caracteres
    if (password.length < 9) {
      setErrorMessage('A senha deve ter no mínimo 9 caracteres para garantir a segurança da sua conta.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('A confirmação da senha não confere com a senha digitada.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await registerNutricionista(nome, email, password);

      if (result.success && result.user) {
        setIsSuccess(true);

        // Dispara efeito de celebração
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D7A49A', '#FFF1E4', '#B97F74', '#10B981'],
          });
        } catch {
          // ignora se confetti falhar
        }

        // Aguarda breve animação e redireciona para o dashboard
        setTimeout(() => {
          onSuccess(result.user!);
        }, 1200);
      } else {
        setErrorMessage(
          result.error ||
            'Não foi possível concluir o cadastro. Por favor, tente novamente.'
        );
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Falha ao conectar com o serviço de cadastro. Tente novamente.'
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
          <CardTitle>Criar sua conta</CardTitle>
          <CardDescription>
            Cadastre-se na NutriOn para gerenciar pacientes, prescrever planos alimentares e ter controle total da sua clínica.
          </CardDescription>
        </CardHeader>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4 animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#2C211E] font-['Outfit']">
                Conta criada com sucesso!
              </h3>
              <p className="text-sm text-[#7A6963] mt-1">
                Salvando dados no Neon e preparando seu dashboard...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent>
              {errorMessage && (
                <Alert
                  variant="error"
                  title="Atenção"
                  message={errorMessage}
                  onClose={() => setErrorMessage(null)}
                />
              )}

              {/* Campo de nome completo */}
              <Input
                id="register-nome"
                name="nome"
                type="text"
                label="Nome completo"
                placeholder="Dra. Mariana Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                autoComplete="name"
                disabled={isLoading}
                leftIcon={<User className="w-4 h-4 text-[#7A6963]" />}
              />

              {/* Campo de email */}
              <Input
                id="register-email"
                name="email"
                type="email"
                label="E-mail profissional"
                placeholder="mariana@nutrion.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
                leftIcon={<Mail className="w-4 h-4 text-[#7A6963]" />}
              />

              {/* Campo de senha */}
              <PasswordInput
                id="register-password"
                name="password"
                label="Senha"
                placeholder="Mínimo de 9 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                showStrengthMeter={true}
                autoComplete="new-password"
                disabled={isLoading}
              />

              {/* Campo de confirmar senha */}
              <PasswordInput
                id="register-confirm-password"
                name="confirmPassword"
                label="Confirmar senha"
                placeholder="Repita a senha digitada"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />

              {/* Botão Criar conta */}
              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                  rightIcon={<UserPlus className="w-4 h-4" />}
                >
                  Criar conta
                </Button>
              </div>
            </CardContent>

            {/* Link Já tem conta? Faça login */}
            <CardFooter>
              <div className="flex flex-col items-center gap-3">
                <p className="text-sm text-[#7A6963]">
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={onNavigateToLogin}
                    className="font-semibold text-[#B97F74] hover:text-[#935A50] hover:underline cursor-pointer transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Faça login
                  </button>
                </p>

                <div className="flex items-center gap-1.5 text-[11px] text-[#7A6963]/80">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sincronização automática com a tabela de nutricionistas</span>
                </div>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
};
