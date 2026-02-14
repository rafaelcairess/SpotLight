import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

interface PasswordResetRequestFormProps {
  onBackToLogin: () => void;
}

export function PasswordResetRequestForm({ onBackToLogin }: PasswordResetRequestFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await requestPasswordReset(email);

    if (error) {
      toast.error('Erro ao enviar recuperação', {
        description: error.message,
      });
    } else {
      toast.success('Email de recuperação enviado', {
        description: 'Confira sua caixa de entrada para continuar.',
      });
      onBackToLogin();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="reset-email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-10 bg-secondary/50 border-border/50"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        variant="glow"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar email de recuperação'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou da senha?{' '}
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-primary hover:underline font-medium"
        >
          Voltar ao login
        </button>
      </p>
    </form>
  );
}
