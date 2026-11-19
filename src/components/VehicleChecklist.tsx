import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export type VehicleChecklistData = {
  fuel_level: string;
  exterior_ok: boolean;
  interior_ok: boolean;
  scratches: boolean;
  dents: boolean;
  objects_inside: boolean;
  notes: string;
};

export const EMPTY_CHECKLIST: VehicleChecklistData = {
  fuel_level: "meio",
  exterior_ok: true,
  interior_ok: true,
  scratches: false,
  dents: false,
  objects_inside: false,
  notes: "",
};

const FUEL = [
  { value: "vazio", label: "Vazio" },
  { value: "1/4", label: "1/4" },
  { value: "meio", label: "Meio" },
  { value: "3/4", label: "3/4" },
  { value: "cheio", label: "Cheio" },
];

export function VehicleChecklist({
  value,
  onChange,
}: {
  value: VehicleChecklistData;
  onChange: (v: VehicleChecklistData) => void;
}) {
  const set = (patch: Partial<VehicleChecklistData>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4">
      <div>
        <p className="font-semibold text-sm">Checklist de entrada</p>
        <p className="text-xs text-muted-foreground">Registre o estado do veículo ao receber</p>
      </div>

      <div className="space-y-2">
        <Label>Nível de combustível</Label>
        <Select value={value.fuel_level} onValueChange={(v) => set({ fuel_level: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {FUEL.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CheckRow
          checked={value.exterior_ok}
          onChange={(c) => set({ exterior_ok: c })}
          label="Exterior ok (sem danos aparentes)"
        />
        <CheckRow
          checked={value.interior_ok}
          onChange={(c) => set({ interior_ok: c })}
          label="Interior ok"
        />
        <CheckRow
          checked={value.scratches}
          onChange={(c) => set({ scratches: c })}
          label="Possui riscos / marcas"
        />
        <CheckRow
          checked={value.dents}
          onChange={(c) => set({ dents: c })}
          label="Possui amassados"
        />
        <CheckRow
          checked={value.objects_inside}
          onChange={(c) => set({ objects_inside: c })}
          label="Objetos pessoais no interior"
        />
      </div>

      <div className="space-y-2">
        <Label>Observações do checklist</Label>
        <Textarea
          rows={2}
          placeholder="Ex: risco na porta do motorista, celular no porta-luvas..."
          value={value.notes}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </div>
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (c: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-white/[0.02]">
      <Checkbox checked={checked} onCheckedChange={(c) => onChange(!!c)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}