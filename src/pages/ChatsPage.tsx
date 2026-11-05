import { FeedbackMessaging } from '@/components/chat/FeedbackMessaging';
import { useMembership } from '@/hooks/useMembership';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { accessCopy } from '@/i18n/access';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ChatsPage() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { canAccessFeature, isLoading: membershipLoading } = useMembership();
  const { isAdmin, isLoading } = useUserRole();
  if (isLoading || membershipLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!canAccessFeature('PRO') && !isAdmin) return <div className="flex flex-col items-center justify-center gap-5 min-h-[60dvh] p-6 text-center text-ts-ink"><p>{accessCopy[language].feedback}</p><Button onClick={() => navigate('/pricing')}>{accessCopy[language].pro}</Button></div>;
  return <FeedbackMessaging />;
}
