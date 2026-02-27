import { useState } from "react";
import { Loader2, CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadCaptureFormProps {
  className?: string;
  source?: string;
}

export default function LeadCaptureForm({ className, source = "website_form" }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    email: "",
    segment: "adult_beginner",
    privacy: false,
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.privacy) return;
    
    setStatus("loading");
    
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(
        `${supabaseUrl}/functions/v1/capture-lead`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            source,
            language: "de",
          }),
        }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setStatus("success");
        if (data.duplicate) {
          setErrorMsg("Du bist bereits registriert!");
        }
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg("Etwas ist schiefgegangen. Bitte versuche es später nochmal.");
    }
  };

  if (status === "success") {
    return (
      <div className={cn("text-center py-16 px-8", className)}>
        <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-400/40 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Willkommen bei TrumpetStar! 🎺</h3>
        <p className="text-white/70 text-base leading-relaxed max-w-sm mx-auto">
          Dein Account wurde erstellt!<br />
          Check deine E-Mails – dein Login-Link ist unterwegs.
        </p>
        {errorMsg && (
          <p className="text-amber-400 text-sm mt-4">{errorMsg}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
      {/* Name */}
      <div className="space-y-1.5">
        <label htmlFor="lead_first_name" className="block text-sm font-medium text-white/90 pl-1">
          Vorname
        </label>
        <input
          id="lead_first_name"
          placeholder="Dein Vorname"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
          className="w-full h-12 px-4 rounded-xl bg-white/95 text-slate-900 placeholder:text-slate-400 border-0 outline-none focus:ring-2 focus:ring-[hsl(var(--reward-gold))]/60 transition-shadow text-base"
        />
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <label htmlFor="lead_email" className="block text-sm font-medium text-white/90 pl-1">
          E-Mail
        </label>
        <input
          id="lead_email"
          type="email"
          placeholder="deine@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="w-full h-12 px-4 rounded-xl bg-white/95 text-slate-900 placeholder:text-slate-400 border-0 outline-none focus:ring-2 focus:ring-[hsl(var(--reward-gold))]/60 transition-shadow text-base"
        />
      </div>

      {/* Segment */}
      <div className="space-y-1.5">
        <label htmlFor="lead_segment" className="block text-sm font-medium text-white/90 pl-1">
          Ich bin...
        </label>
        <select
          id="lead_segment"
          value={formData.segment}
          onChange={(e) => setFormData({ ...formData, segment: e.target.value })}
          className="w-full h-12 px-4 rounded-xl bg-white/95 text-slate-900 border-0 outline-none focus:ring-2 focus:ring-[hsl(var(--reward-gold))]/60 transition-shadow text-base appearance-none cursor-pointer"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
        >
          <option value="adult_beginner">Erwachsener Anfänger / Wiedereinsteiger</option>
          <option value="parent_child">Elternteil – Kind (6–14 Jahre)</option>
          <option value="teacher">Musiklehrer</option>
        </select>
      </div>

      {/* Privacy */}
      <label className="flex items-start gap-3 pt-1 cursor-pointer group">
        <input
          type="checkbox"
          checked={formData.privacy}
          onChange={(e) => setFormData({ ...formData, privacy: e.target.checked })}
          required
          className="mt-1 w-5 h-5 rounded border-2 border-white/30 bg-white/10 checked:bg-[hsl(var(--reward-gold))] checked:border-[hsl(var(--reward-gold))] text-slate-900 focus:ring-2 focus:ring-[hsl(var(--reward-gold))]/40 cursor-pointer transition-colors shrink-0 accent-[hsl(48,100%,50%)]"
        />
        <span className="text-sm text-white/70 leading-relaxed group-hover:text-white/80 transition-colors">
          Ich stimme zu, dass TrumpetStar mich per E-Mail kontaktieren darf. 
          Abmeldung jederzeit möglich.{" "}
          <a href="/datenschutz" className="text-[hsl(var(--reward-gold))] hover:underline font-medium">
            Datenschutz
          </a>
        </span>
      </label>

      {status === "error" && (
        <div className="bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3">
          <p className="text-red-300 text-sm">{errorMsg}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={!formData.privacy || status === "loading"}
        className="w-full h-14 rounded-xl font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,45%)] text-slate-900 shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 hover:scale-[1.01] active:scale-[0.99]"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Wird gesendet...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Jetzt kostenlos starten
          </>
        )}
      </button>

      <p className="text-xs text-white/40 text-center pt-1">
        Kein Spam. Nur wertvolle Tipps für deinen Trompeten-Erfolg.
      </p>
    </form>
  );
}
