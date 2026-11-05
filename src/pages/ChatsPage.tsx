import { FeedbackMessaging } from '@/components/chat/FeedbackMessaging';
import { PremiumFeatureLock } from '@/components/premium/PremiumFeatureLock';
import { useMembership } from '@/hooks/useMembership';
import { useUserRole } from '@/hooks/useUserRole';

export function ChatsPage() {
  const { canAccessFeature } = useMembership();
  const { isTeacher, isLoading } = useUserRole();
  if (!isLoading && !canAccessFeature('PRO') && !isTeacher) return <PremiumFeatureLock feature="feedback" />;
  return <FeedbackMessaging />;
}
