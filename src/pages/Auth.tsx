import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Orbit } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';
import { SignupForm } from '@/components/auth/SignupForm';
import { PasswordResetRequestForm } from '@/components/auth/PasswordResetRequestForm';
import { PasswordResetForm } from '@/components/auth/PasswordResetForm';
import { useAuth } from '@/contexts/AuthContext';

const Auth = () => {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset' | 'recover'>('login');
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryMode = params.get('mode');
    if (queryMode === 'signup') setMode('signup');
    if (queryMode === 'reset') setMode('recover');

    if (window.location.hash.includes('type=recovery')) {
      setMode('recover');
    }
  }, []);

  useEffect(() => {
    if (!loading && user && mode !== 'recover') {
      navigate('/');
    }
  }, [user, loading, navigate, mode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <Orbit className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="relative">
            <Orbit className="w-10 h-10 text-primary" />
            <div className="absolute inset-0 blur-lg bg-primary/30" />
          </div>
          <span className="text-3xl font-bold text-gradient-primary">
            SpotLight
          </span>
        </div>

        <Card className="glass border-border/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {mode === 'login' && 'Bem-vindo de volta!'}
              {mode === 'signup' && 'Crie sua conta'}
              {mode === 'reset' && 'Recuperar senha'}
              {mode === 'recover' && 'Definir nova senha'}
            </CardTitle>
            <CardDescription>
              {mode === 'login' && 'Entre para acessar sua biblioteca de jogos'}
              {mode === 'signup' && 'Junte-se à comunidade SpotLight'}
              {mode === 'reset' && 'Enviaremos um link de recuperação para seu email'}
              {mode === 'recover' && 'Crie uma nova senha para sua conta'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === 'login' && (
              <LoginForm
                onSwitchToSignup={() => setMode('signup')}
                onForgotPassword={() => setMode('reset')}
              />
            )}
            {mode === 'signup' && (
              <SignupForm onSwitchToLogin={() => setMode('login')} />
            )}
            {mode === 'reset' && (
              <PasswordResetRequestForm onBackToLogin={() => setMode('login')} />
            )}
            {mode === 'recover' && (
              <PasswordResetForm onBackToLogin={() => setMode('login')} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
