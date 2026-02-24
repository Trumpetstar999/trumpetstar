import { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { supabase } from '@/integrations/supabase/client';
import { FAQSchema } from '@/components/SEO';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, BookOpen, CreditCard, HelpCircle, Lightbulb, ArrowLeft, Mail, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';

type Language = 'de' | 'en' | 'es';

interface FaqItem {
  id: string;
  category: string;
  sort_order: number;
  question_de: string;
  answer_de: string;
  question_en: string | null;
  answer_en: string | null;
  question_es: string | null;
  answer_es: string | null;
}

interface KnowledgeTip {
  id: string;
  title: string;
  title_en: string | null;
  title_es: string | null;
  content: string | null;
  content_en: string | null;
  content_es: string | null;
  tags: string[] | null;
}

const CATEGORIES = {
  'app-features': { icon: BookOpen, de: 'App-Funktionen', en: 'App Features', es: 'Funciones de la App' },
  'account': { icon: CreditCard, de: 'Account & Abo', en: 'Account & Plans', es: 'Cuenta y Planes' },
  'general': { icon: HelpCircle, de: 'Allgemein', en: 'General', es: 'General' },
  'tips': { icon: Lightbulb, de: 'Trompeten-Tipps von Tim', en: 'Trumpet Tips from Tim', es: 'Consejos de Trompeta de Tim' },
} as const;

const TEXTS = {
  de: { title: 'Hilfe-Center', subtitle: 'Alles was du über TrumpetStar wissen musst', search: 'Suche...', noResults: 'Keine Ergebnisse gefunden.', contact: 'Noch Fragen?', contactText: 'Schreib uns eine E-Mail oder frag unseren KI-Assistenten Tim direkt in der App.', backToApp: 'Zurück zur App', tipsIntro: 'Tipps aus der Wissensdatenbank unseres KI-Assistenten Tim:' },
  en: { title: 'Help Center', subtitle: 'Everything you need to know about TrumpetStar', search: 'Search...', noResults: 'No results found.', contact: 'Still have questions?', contactText: 'Send us an email or ask our AI assistant Tim directly in the app.', backToApp: 'Back to app', tipsIntro: 'Tips from our AI assistant Tim\'s knowledge base:' },
  es: { title: 'Centro de Ayuda', subtitle: 'Todo lo que necesitas saber sobre TrumpetStar', search: 'Buscar...', noResults: 'Sin resultados.', contact: '¿Más preguntas?', contactText: 'Envíanos un email o pregúntale a nuestro asistente IA Tim en la app.', backToApp: 'Volver a la app', tipsIntro: 'Consejos de la base de conocimientos de nuestro asistente IA Tim:' },
};

function getLocalizedText(item: { question_de: string; answer_de: string; question_en?: string | null; answer_en?: string | null; question_es?: string | null; answer_es?: string | null }, lang: Language) {
  const q = (lang === 'en' && item.question_en) || (lang === 'es' && item.question_es) || item.question_de;
  const a = (lang === 'en' && item.answer_en) || (lang === 'es' && item.answer_es) || item.answer_de;
  return { question: q, answer: a };
}

function getLocalizedKnowledge(item: KnowledgeTip, lang: Language) {
  const title = (lang === 'en' && item.title_en) || (lang === 'es' && item.title_es) || item.title;
  const content = (lang === 'en' && item.content_en) || (lang === 'es' && item.content_es) || item.content || '';
  return { title, content };
}

export default function HelpCenterPage() {
  const { language } = useLanguage();
  const lang = language as Language;
  const t = TEXTS[lang] || TEXTS.de;
  const navigate = useNavigate();

  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);
  const [knowledgeTips, setKnowledgeTips] = useState<KnowledgeTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [faqRes, tipsRes] = await Promise.all([
        supabase.from('faq_items').select('*').eq('is_active', true).order('category').order('sort_order'),
        supabase.from('knowledge_sources').select('id, title, title_en, title_es, content, content_en, content_es, tags')
          .overlaps('tags', ['beginners', 'practice', 'troubleshooting', 'tone', 'fingering'])
          .limit(20),
      ]);
      if (faqRes.data) setFaqItems(faqRes.data as FaqItem[]);
      if (tipsRes.data) setKnowledgeTips(tipsRes.data as KnowledgeTip[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filteredFaqs = useMemo(() => {
    if (!search.trim()) return faqItems;
    const s = search.toLowerCase();
    return faqItems.filter(item => {
      const { question, answer } = getLocalizedText(item, lang);
      return question.toLowerCase().includes(s) || answer.toLowerCase().includes(s);
    });
  }, [faqItems, search, lang]);

  const filteredTips = useMemo(() => {
    if (!search.trim()) return knowledgeTips;
    const s = search.toLowerCase();
    return knowledgeTips.filter(item => {
      const { title, content } = getLocalizedKnowledge(item, lang);
      return title.toLowerCase().includes(s) || content.toLowerCase().includes(s);
    });
  }, [knowledgeTips, search, lang]);

  const groupedFaqs = useMemo(() => {
    const groups: Record<string, typeof filteredFaqs> = {};
    filteredFaqs.forEach(item => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [filteredFaqs]);

  const allFaqSchema = useMemo(() => {
    return faqItems.map(item => {
      const { question, answer } = getLocalizedText(item, lang);
      return { question, answer };
    });
  }, [faqItems, lang]);

  const hasResults = filteredFaqs.length > 0 || filteredTips.length > 0;

  return (
    <SEOPageLayout>
      <FAQSchema faqs={allFaqSchema} />

      <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--brand-blue-start))] via-[hsl(var(--brand-blue-mid))] to-[hsl(var(--brand-blue-end))]">
        {/* Header */}
        <div className="sticky top-0 z-40 glass safe-top">
          <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 gap-2" onClick={() => navigate('/app')}>
              <ArrowLeft className="w-4 h-4" />
              {t.backToApp}
            </Button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-5 py-8 space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{t.title}</h1>
            <p className="text-white/75 text-lg">{t.subtitle}</p>
          </div>

          {/* Search */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.search}
              className="pl-12 h-12 bg-white border-0 shadow-lg text-slate-900 placeholder:text-slate-400 rounded-xl"
            />
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-xl bg-white/10" />)}
            </div>
          ) : !hasResults ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center text-muted-foreground">{t.noResults}</CardContent>
            </Card>
          ) : (
            <>
              {/* FAQ Categories */}
              {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>)
                .filter(cat => cat !== 'tips' && groupedFaqs[cat]?.length)
                .map(cat => {
                  const catInfo = CATEGORIES[cat];
                  const Icon = catInfo.icon;
                  const catLabel = catInfo[lang] || catInfo.de;
                  return (
                    <Card key={cat} className="border-0 shadow-lg rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-[hsl(var(--brand-blue-start))] to-[hsl(var(--brand-blue-mid))] px-6 py-4 flex items-center gap-3">
                        <Icon className="w-5 h-5 text-white" />
                        <h2 className="text-lg font-bold text-white">{catLabel}</h2>
                      </div>
                      <CardContent className="p-4">
                        <Accordion type="single" collapsible className="w-full">
                          {groupedFaqs[cat].map((item, i) => {
                            const { question, answer } = getLocalizedText(item, lang);
                            return (
                              <AccordionItem key={item.id} value={item.id} className="border-slate-100">
                                <AccordionTrigger className="text-left text-sm font-semibold text-slate-900 hover:no-underline py-3">
                                  {question}
                                </AccordionTrigger>
                                <AccordionContent className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                  {answer}
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </CardContent>
                    </Card>
                  );
                })}

              {/* Tim's Tips from knowledge_sources */}
              {filteredTips.length > 0 && (
                <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-[hsl(var(--reward-gold))] to-[hsl(48,100%,40%)] px-6 py-4 flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-slate-900" />
                    <h2 className="text-lg font-bold text-slate-900">{CATEGORIES.tips[lang] || CATEGORIES.tips.de}</h2>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500 mb-3">{t.tipsIntro}</p>
                    <Accordion type="single" collapsible className="w-full">
                      {filteredTips.map(item => {
                        const { title, content } = getLocalizedKnowledge(item, lang);
                        return (
                          <AccordionItem key={item.id} value={item.id} className="border-slate-100">
                            <AccordionTrigger className="text-left text-sm font-semibold text-slate-900 hover:no-underline py-3">
                              {title}
                            </AccordionTrigger>
                            <AccordionContent className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                              {content}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Contact Section */}
          <Card className="border-0 shadow-lg rounded-xl">
            <CardContent className="p-6 text-center space-y-4">
              <h3 className="text-lg font-bold text-slate-900">{t.contact}</h3>
              <p className="text-sm text-slate-600">{t.contactText}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="mailto:info@trumpetstar.com"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  <Mail className="w-4 h-4" />
                  info@trumpetstar.com
                </a>
                <a
                  href="https://trumpetstar.lovable.app/trompete-lernen"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Trompete lernen
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SEOPageLayout>
  );
}
