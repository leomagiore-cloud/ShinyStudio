import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Modal que pede o PIN de administrador antes de confirmar uma exclusão
 * feita por um usuário colaborador. O PIN é verificado no banco via RPC
 * (admin_delete_*), então esse componente só coleta o valor digitado.
 */
export function AdminPinDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
  entityLabel = "este item",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (pin: string) => void;
  loading?: boolean;
  entityLabel?: string;
}) {
  const [pin, setPin] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) setPin("");
      }}
    >
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Confirmação de administrador</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Excluir {entityLabel} exige o PIN do administrador. Peça para ele digitar aqui.
        </p>
        <div className="space-y-2">
          <Label htmlFor="admin-pin-input">PIN de administrador</Label>
          <Input
            id="admin-pin-input"
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && pin) onConfirm(pin); }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" disabled={!pin || loading} onClick={() => onConfirm(pin)}>
            Confirmar exclusão
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
