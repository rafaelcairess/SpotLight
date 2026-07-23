import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";

interface ManualHoursDialogProps {
  open: boolean;
  hours: string;
  overrideEnabled: boolean;
  saving: boolean;
  onHoursChange: (hours: string) => void;
  onOverrideChange: (enabled: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
}

/**
 * Formulário isolado porque editar horas é uma regra independente do card da
 * biblioteca. O componente pai continua responsável por persistir a alteração.
 */
export function ManualHoursDialog({
  open,
  hours,
  overrideEnabled,
  saving,
  onHoursChange,
  onOverrideChange,
  onCancel,
  onSave,
}: ManualHoursDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("library.editHoursTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
            <Label className="text-xs text-muted-foreground">{t("library.useManualHours")}</Label>
            <Switch checked={overrideEnabled} onCheckedChange={onOverrideChange} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manualHours">{t("library.editHoursLabel")}</Label>
            <Input
              id="manualHours"
              type="number"
              min="0"
              step="0.1"
              value={hours}
              onChange={(event) => onHoursChange(event.target.value)}
              placeholder={t("library.manualHoursPlaceholder")}
              disabled={!overrideEnabled}
            />
            <p className="text-xs text-muted-foreground">{t("library.editHoursHint")}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {t("common.actions.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
