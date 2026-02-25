import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle, Music } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadCaptureFormProps {
  className?: string;
  source?: string;
}

export default function LeadCaptureForm({ className, source = "website_form" }: LeadCaptureFormProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    email: "",
    segment: "adult",
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
      <div className={cn("text-center py-12 px-6", className)}>
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Fast geschafft! 🎺</h3>
        <p className="text-gray-600 mb-4">
          Check deine E-Mails (auch den Spam-Ordner). Deine erste Lektion wartet schon!
        </p>
        {errorMsg && (
          <p className="text-amber-600 text-sm">{errorMsg}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label htmlFor="first_name" className="text-gray-700">Vorname</Label>
        <Input
          id="first_name"
          placeholder="Dein Vorname"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700">E-Mail</Label>
        <Input
          id="email"
          type="email"
          placeholder="deine@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          className="h-12"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700">Ich bin...</Label>
        <Select
          value={formData.segment}
          onValueChange={(v) => setFormData({ ...formData, segment: v })}
        >
          <SelectTrigger className="h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="adult">Erwachsener (25-65)</SelectItem>
            <SelectItem value="parent">Elternteil (Kind 6-14)</SelectItem>
            <SelectItem value="teacher">Musiklehrer/Dirigent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-start space-x-3 py-2">
        <Checkbox
          id="privacy"
          checked={formData.privacy}
          onCheckedChange={(checked) => 
            setFormData({ ...formData, privacy: checked as boolean })
          }
          required
        />
        <Label htmlFor="privacy" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
          Ich stimme zu, dass TrumpetStar mich per E-Mail kontaktieren darf. 
          Abmeldung jederzeit möglich. 
          <a href="/datenschutz" className="text-purple-600 hover:underline ml-1">Datenschutz</a>
        </Label>
      </div>

      {status === "error" && (
        <p className="text-red-600 text-sm">{errorMsg}</p>
      )}

      <Button
        type="submit"
        disabled={!formData.privacy || status === "loading"}
        className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Wird gesendet...
          </>
        ) : (
          <>
            <Music className="mr-2 h-5 w-5" />
            Jetzt kostenlos starten
          </>
        )}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Keine Spam-Mails. Nur wertvolle Tipps für deinen Trompeten-Erfolg.
      </p>
    </form>
  );
}
