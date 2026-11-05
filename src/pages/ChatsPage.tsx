import { FeedbackMessaging } from '@/components/chat/FeedbackMessaging';
import { PremiumFeatureLock } from '@/components/premium/PremiumFeatureLock';
import { useMembership } from '@/hooks/useMembership';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

export function ChatsPage() {
  const { canAccessFeature, isLoading: membershipLoading } = useMembership();
  const { isAdmin, isLoading } = useUserRole();
  if (isLoading || membershipLoading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!canAccessFeature('PRO') && !isAdmin) return <PremiumFeatureLock feature="feedback" />;
  return <FeedbackMessaging />;
}
