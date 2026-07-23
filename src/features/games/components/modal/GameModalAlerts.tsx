/**
 * Componente da feature games.
 */

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePriceAlerts } from "@/hooks/usePriceAlerts";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

interface GameModalAlertsProps {
  appId: number;
}

export const GameModalAlerts = ({ appId }: GameModalAlertsProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Estado interno do modal e do valor do preco alvo.
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState("");

  const {
    alerts: priceAlerts,
    addAlert,
    removeAlert,
    isLoading: alertsLoading,
  } = usePriceAlerts(appId);

  const activeAlert = priceAlerts[0] ?? null;
  const isBusy = addAlert.isPending || removeAlert.isPending;

  useEffect(() => {
    if (!isAlertOpen) return;
    if (activeAlert?.target_price !== null && activeAlert?.target_price !== undefined) {
      setTargetPriceInput(String(activeAlert.target_price));
    } else {
      setTargetPriceInput("");
    }
  }, [isAlertOpen, activeAlert]);

  const handleOpenAlert = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setIsAlertOpen(true);
  };

  const handleSaveAlert = async (event: React.FormEvent) => {
    event.preventDefault();

    const raw = targetPriceInput.trim();
    const normalized = raw === "" ? null : Number(raw.replace(",", "."));
    if (normalized !== null && (Number.isNaN(normalized) || normalized < 0)) {
      toast({
        title: t("gameModal.invalidPrice"),
        description: t("gameModal.invalidPriceDesc"),
        variant: "destructive",
      });
      return;
    }

    try {
      await addAlert.mutateAsync({
        gameId: appId,
        targetPrice: normalized,
      });
      toast({ title: t("gameModal.alertSaved") });
      setIsAlertOpen(false);
    } catch (error) {
      toast({ title: t("gameModal.alertSaveError"), variant: "destructive" });
    }
  };

  const handleRemoveAlert = async () => {
    if (!activeAlert) return;
    try {
      await removeAlert.mutateAsync(activeAlert.id);
      toast({ title: t("gameModal.alertRemoved") });
      setIsAlertOpen(false);
    } catch (error) {
      toast({ title: t("gameModal.alertRemoveError"), variant: "destructive" });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleOpenAlert}
          disabled={isBusy}
        >
          <Bell className="w-4 h-4" />
          {alertsLoading
            ? t("gameModal.loadingAlert")
            : activeAlert
              ? t("gameModal.editAlert")
              : t("gameModal.receiveAlert")}
        </Button>
        {activeAlert && (
          <span className="text-xs text-muted-foreground">{t("gameModal.activeAlert")}</span>
        )}
      </div>

      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("gameModal.alertTitle")}</DialogTitle>
            <DialogDescription>{t("gameModal.alertDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveAlert} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alert-target-price">{t("gameModal.alertTarget")}</Label>
              <Input
                id="alert-target-price"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder={t("gameModal.alertPlaceholder")}
                value={targetPriceInput}
                onChange={(event) => setTargetPriceInput(event.target.value)}
              />
            </div>

            {activeAlert && (
              <div className="rounded-lg border border-border/50 bg-secondary/30 p-3 text-xs text-muted-foreground">
                {activeAlert.target_price
                  ? t("gameModal.alertActiveTarget")
                  : t("gameModal.alertActiveAny")}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2">
              {activeAlert && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  onClick={handleRemoveAlert}
                  disabled={isBusy}
                >
                  {t("gameModal.removeAlert")}
                </Button>
              )}
              <Button type="submit" disabled={isBusy}>
                {isBusy ? t("gameModal.savingAlert") : t("gameModal.saveAlert")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
