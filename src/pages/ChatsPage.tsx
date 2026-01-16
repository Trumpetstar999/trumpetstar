import { ChatLayout } from '@/components/chat/ChatLayout';
import { PremiumFeatureLock } from '@/components/premium/PremiumFeatureLock';
import { useMembership } from '@/hooks/useMembership';

export function ChatsPage() {
  const { canAccessFeature } = useMembership();
  
  // Check if user has PREMIUM access for Feedback/Chat
  const hasPremiumAccess = canAccessFeature('PREMIUM');

  // Show Premium Lock if user doesn't have access
  if (!hasPremiumAccess) {
    return <PremiumFeatureLock feature="feedback" />;
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <ChatLayout />
    </div>
  );
}
