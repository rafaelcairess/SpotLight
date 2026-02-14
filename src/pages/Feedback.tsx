import { useMemo, useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Header from "@/components/Header";
import SectionHeader from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackList, useSendFeedback } from "@/hooks/useFeedback";
import { toast } from "sonner";

const ADMIN_EMAILS = ["rafaelcairespires@gmail.com"];

export default function Feedback() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const isAdmin = useMemo(() => {
    return !!user?.email && ADMIN_EMAILS.includes(user.email);
  }, [user?.email]);

  const sendFeedback = useSendFeedback();
  const { data: feedbackList = [], isLoading } = useFeedbackList();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      await sendFeedback.mutateAsync({ name, email, message });
      toast.success("Feedback enviado. Obrigado!");
      setMessage("");
      if (!name.trim()) setName("");
      if (!email.trim()) setEmail("");
    } catch (error) {
      const description = error instanceof Error ? error.message : "Tente novamente.";
      toast.error("Não foi possível enviar", { description });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Feedback"
            subtitle="Você pode enviar anonimamente"
            icon={MessageSquare}
          />

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-border/40 bg-card/50 p-6 space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="feedback-name">Nome (opcional)</Label>
                  <Input
                    id="feedback-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback-email">Email (opcional)</Label>
                  <Input
                    id="feedback-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="bg-secondary/50 border-border/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-message">Mensagem</Label>
                <Textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva sua sugestão, crítica ou ideia..."
                  className="min-h-[140px] bg-secondary/50 border-border/50"
                  required
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Sem pressão: curto ou detalhado, você decide.</span>
              </div>

              <Button type="submit" variant="glow" disabled={sendFeedback.isPending}>
                {sendFeedback.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar feedback"
                )}
              </Button>
            </form>

            <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
              <h3 className="text-lg font-semibold">Como o feedback ajuda</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Tudo o que você enviar chega direto para o admin do SpotLight.
                Sugestões de jogos, bugs, ideias de coleções ou melhorias são bem-vindas.
              </p>

              {isAdmin && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">Caixa de feedback</h4>
                    {isLoading && (
                      <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Carregando
                      </div>
                    )}
                  </div>

                  {isLoading ? null : feedbackList.length === 0 ? (
                    <div className="rounded-lg border border-border/40 bg-background/40 p-4 text-xs text-muted-foreground">
                      Nenhum feedback recebido ainda.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {feedbackList.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-lg border border-border/40 bg-background/40 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">
                                {item.name || "Anônimo"}
                              </p>
                              {item.email && (
                                <p className="text-xs text-muted-foreground">{item.email}</p>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                          <p className="mt-3 text-sm text-foreground/90 whitespace-pre-wrap">
                            {item.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
