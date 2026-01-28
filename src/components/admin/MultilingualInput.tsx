import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Language = 'de' | 'en' | 'es';

interface MultilingualInputProps {
  /** Base label for the field */
  label: string;
  /** German value (primary) */
  valueDE: string;
  /** English value */
  valueEN: string;
  /** Spanish value */
  valueES: string;
  /** Callback when German value changes */
  onChangeDE: (value: string) => void;
  /** Callback when English value changes */
  onChangeEN: (value: string) => void;
  /** Callback when Spanish value changes */
  onChangeES: (value: string) => void;
  /** Use textarea instead of input */
  multiline?: boolean;
  /** Placeholder text (uses label if not provided) */
  placeholder?: string;
  /** Number of rows for textarea */
  rows?: number;
  /** Whether the field is required */
  required?: boolean;
  /** Additional class names */
  className?: string;
}

const LANGUAGE_FLAGS: Record<Language, string> = {
  de: '🇩🇪',
  en: '🇬🇧',
  es: '🇪🇸',
};

const LANGUAGE_LABELS: Record<Language, string> = {
  de: 'DE',
  en: 'EN',
  es: 'ES',
};

export function MultilingualInput({
  label,
  valueDE,
  valueEN,
  valueES,
  onChangeDE,
  onChangeEN,
  onChangeES,
  multiline = false,
  placeholder,
  rows = 3,
  required = false,
  className,
}: MultilingualInputProps) {
  const [activeTab, setActiveTab] = useState<Language>('de');

  const values: Record<Language, string> = { de: valueDE, en: valueEN, es: valueES };
  const handlers: Record<Language, (value: string) => void> = { 
    de: onChangeDE, 
    en: onChangeEN, 
    es: onChangeES 
  };

  // Check which languages have content
  const hasContent: Record<Language, boolean> = {
    de: valueDE.trim().length > 0,
    en: valueEN.trim().length > 0,
    es: valueES.trim().length > 0,
  };

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        <div className="flex items-center gap-1">
          {(['de', 'en', 'es'] as Language[]).map((lang) => (
            <span 
              key={lang}
              className={cn(
                "w-2 h-2 rounded-full",
                hasContent[lang] ? "bg-green-500" : "bg-gray-300"
              )}
              title={hasContent[lang] ? `${LANGUAGE_LABELS[lang]} vorhanden` : `${LANGUAGE_LABELS[lang]} fehlt`}
            />
          ))}
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Language)}>
        <TabsList className="h-8 p-0.5 w-full grid grid-cols-3">
          {(['de', 'en', 'es'] as Language[]).map((lang) => (
            <TabsTrigger 
              key={lang} 
              value={lang}
              className={cn(
                "h-7 text-xs gap-1",
                hasContent[lang] && lang !== activeTab && "text-green-600"
              )}
            >
              <span>{LANGUAGE_FLAGS[lang]}</span>
              <span>{LANGUAGE_LABELS[lang]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {(['de', 'en', 'es'] as Language[]).map((lang) => (
          <TabsContent key={lang} value={lang} className="mt-2">
            <InputComponent
              value={values[lang]}
              onChange={(e) => handlers[lang](e.target.value)}
              placeholder={placeholder || `${label} (${LANGUAGE_LABELS[lang]})`}
              {...(multiline ? { rows } : {})}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

// Compact version for inline editing (single line only)
interface CompactMultilingualInputProps {
  valueDE: string;
  valueEN: string;
  valueES: string;
  onChangeDE: (value: string) => void;
  onChangeEN: (value: string) => void;
  onChangeES: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CompactMultilingualInput({
  valueDE,
  valueEN,
  valueES,
  onChangeDE,
  onChangeEN,
  onChangeES,
  placeholder = 'Text',
  className,
}: CompactMultilingualInputProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">🇩🇪</span>
        <Input
          value={valueDE}
          onChange={(e) => onChangeDE(e.target.value)}
          placeholder={`${placeholder} (DE)`}
          className="pl-7 text-sm"
        />
      </div>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">🇬🇧</span>
        <Input
          value={valueEN}
          onChange={(e) => onChangeEN(e.target.value)}
          placeholder={`${placeholder} (EN)`}
          className="pl-7 text-sm"
        />
      </div>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs">🇪🇸</span>
        <Input
          value={valueES}
          onChange={(e) => onChangeES(e.target.value)}
          placeholder={`${placeholder} (ES)`}
          className="pl-7 text-sm"
        />
      </div>
    </div>
  );
}
