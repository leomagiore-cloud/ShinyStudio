let ctx: AudioContext | null = null;

/** Toca um "ding-dong" curto quando um novo agendamento online chega. */
export function playNotificationSound() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();

    const now = ctx.currentTime;
    const notes = [880, 1174.66]; // A5 → D6
    notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.18;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // Autoplay bloqueado pelo navegador ou API indisponível — ignora silenciosamente.
  }
}
