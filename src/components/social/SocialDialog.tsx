import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FriendSearch } from './FriendSearch';
import { FriendsList } from './FriendsList';
import { StarRanking } from './StarRanking';

interface SocialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SocialDialog({ open, onOpenChange }: SocialDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Freunde & Ranking</DialogTitle>
          <DialogDescription>Finde Freunde und vergleiche eure Sterne</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="friends" className="flex-1">Freunde</TabsTrigger>
            <TabsTrigger value="search" className="flex-1">Suche</TabsTrigger>
            <TabsTrigger value="ranking" className="flex-1">Ranking</TabsTrigger>
          </TabsList>
          <TabsContent value="friends">
            <FriendsList />
          </TabsContent>
          <TabsContent value="search">
            <FriendSearch />
          </TabsContent>
          <TabsContent value="ranking">
            <StarRanking />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
