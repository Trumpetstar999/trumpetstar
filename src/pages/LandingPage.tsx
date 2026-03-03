import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Music, Headphones, CheckCircle, Star, ArrowRight } from 'lucide-react';
import { SEOPageLayout } from '@/components/seo/SEOPageLayout';
import { FAQSchema } from '@/components/SEO';
import trumpetstarLogo from '@/assets/trumpetstar-logo.png';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import appScreenshot from '@/assets/trumpetstar-app-screenshot.png';
import { useLanguage } from '@/hooks/useLanguage';

export default function LandingPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { t } = useLanguage();

  // Check session and redirect if logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Track auto-redirect
        supabase.from('activity_logs').insert([{
          user_id: session.user.id,
          action: 'auto_redirect_to_app',
          metadata: { from: '/' },
        }]).then(() => {});
        navigate('/app', { replace: true });
      } else {
        setChecking(false);
      }
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(212,100%,56%)] via-[hsl(218,88%,46%)] to-[hsl(222,86%,29%)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  const handleCtaClick = () => {
    const params = new URLSearchParams(window.location.search);
    const utmString = params.toString();
    navigate(`/signup${utmString ? `?${utmString}` : ''}`);
  };

  const landingFaqs = [
    { question: t('landing.faq.q1'), answer: t('landing.faq.a1') },
    { question: t('landing.faq.q2'), answer: t('landing.faq.a2') },
    { question: t('landing.faq.q3'), answer: t('landing.faq.a3') },
    { question: t('landing.faq.q4'), answer: t('landing.faq.a4') },
  ];

  const uspItems = [
    { icon: Play, title: t('landing.usps.video.title'), desc: t('landing.usps.video.desc') },
    { icon: Headphones, title: t('landing.usps.audio.title'), desc: t('landing.usps.audio.desc') },
    { icon: Music, title: t('landing.usps.tools.title'), desc: t('landing.usps.tools.desc') },
  ];

  const howItWorksSteps = [
    { step: '1', title: t('landing.howItWorks.step1.title'), desc: t('landing.howItWorks.step1.desc') },
    { step: '2', title: t('landing.howItWorks.step2.title'), desc: t('landing.howItWorks.step2.desc') },
    { step: '3', title: t('landing.howItWorks.step3.title'), desc: t('landing.howItWorks.step3.desc') },
  ];

  return (
    <SEOPageLayout
      title={t('landing.seo.title')}
      description={t('landing.seo.description')}
    >
      <FAQSchema faqs={landingFaqs} />

      <div className="bg-gradient-to-b from-[hsl(212,100%,56%)] via-[hsl(218,88%,46%)] to-[hsl(222,86%,29%)]">
        {/* Hero Section */}
        <section className="relative max-w-5xl mx-auto px-5 pt-16 pb-20 text-center">

          <div className="flex justify-center mb-8">
            <img src={trumpetstarLogo} alt="Trumpetstar" className="h-20 w-auto drop-shadow-lg" />
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            {t('landing.hero.title').split('\n').map((line, i, arr) => (
              i < arr.length - 1 ? <span key={i}>{line}<br /></span> : <span key={i}>{line}</span>
            ))}{' '}
            <span className="text-[hsl(var(--reward-gold))]">{t('landing.hero.titleHighlight')}</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            {t('landing.hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              onClick={handleCtaClick}
              className="h-14 px-8 text-lg font-bold bg-[hsl(var(--reward-gold))] hover:bg-[hsl(48,100%,45%)] text-slate-900 rounded-xl shadow-lg shadow-yellow-500/30 gap-2"
            >
              {t('landing.hero.ctaStart')} <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => navigate('/login')}
              className="h-14 px-8 text-lg text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
            >
              {t('landing.hero.ctaLogin')}
            </Button>
          </div>
        </section>

        {/* App Screenshot */}
        <section className="max-w-4xl mx-auto px-5 pb-16">
          <div className="relative">
            <div className="absolute inset-0 bg-[hsl(var(--reward-gold))]/10 blur-3xl rounded-full scale-75 pointer-events-none" />
            <button onClick={() => navigate('/login')} className="block w-full max-w-2xl mx-auto group cursor-pointer">
              <img
                src={appScreenshot}
                alt={t('landing.hero.imageAlt')}
                className="relative w-full rounded-2xl shadow-2xl shadow-black/40 border border-white/10 transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-[hsl(var(--reward-gold))] text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg text-lg flex items-center gap-2">
                  <Play className="w-5 h-5 fill-current" /> {t('landing.hero.imageHover')}
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* USPs */}
        <section className="max-w-5xl mx-auto px-5 pb-20">
          <div className="grid md:grid-cols-3 gap-6">
            {uspItems.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-6 text-center">
                <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-[hsl(var(--reward-gold))]" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-4xl mx-auto px-5 pb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-12">{t('landing.howItWorks.title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {howItWorksSteps.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[hsl(var(--reward-gold))] text-slate-900 font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/70">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social Proof */}
        <section className="max-w-4xl mx-auto px-5 pb-20">
          <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-8 text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-6 h-6 text-[hsl(var(--reward-gold))] fill-[hsl(var(--reward-gold))]" />
              ))}
            </div>
            <p className="text-white/90 text-lg italic mb-4">
              „{t('landing.socialProof.quote')}"
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm text-white/60">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> {t('landing.socialProof.badge1')}</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> {t('landing.socialProof.badge2')}</span>
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-400" /> {t('landing.socialProof.badge3')}</span>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-5 pb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-8">{t('landing.faq.title')}</h2>
          <div className="space-y-4">
            {landingFaqs.map(({ question, answer }) => (
              <details key={question} className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl overflow-hidden group">
                <summary className="cursor-pointer px-6 py-4 text-white font-semibold flex items-center justify-between">
                  {question}
                  <ArrowRight className="w-4 h-4 text-white/50 transition-transform group-open:rotate-90" />
                </summary>
                <div className="px-6 pb-4 text-white/70 text-sm">
                  {answer}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Lead Capture Form */}
        <section className="max-w-md mx-auto px-5 pb-24">
          <div className="relative bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-3xl p-8 md:p-10 shadow-2xl shadow-black/20">
            {/* Decorative glow */}
            <div className="absolute -inset-1 bg-gradient-to-b from-[hsl(var(--reward-gold))]/10 via-transparent to-transparent rounded-3xl blur-xl pointer-events-none" />

            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
                {t('landing.capture.title')}
              </h2>
              <p className="text-white/60 text-center text-sm mb-8">
                {t('landing.capture.subtitle')}
              </p>
              <LeadCaptureForm source="landing_page" />
            </div>
          </div>
        </section>
      </div>
    </SEOPageLayout>
  );
}
