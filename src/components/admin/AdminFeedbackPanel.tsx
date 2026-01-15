import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Loader2, MessageSquare, Video, Clock, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface FeedbackRequest {
  id: string;
  user_id: string;
  user_video_id: string;
  message: string | null;
  status: 'open' | 'answered' | 'closed';
  chat_id: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  video?: {
    title: string | null;
    storage_path: string;
  };
}

export function AdminFeedbackPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<FeedbackRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<FeedbackRequest | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_feedback_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles and videos
      const requestsWithDetails = await Promise.all(
        (data || []).map(async (req) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', req.user_id)
            .single();

          const { data: video } = await supabase
            .from('user_recordings')
            .select('title, storage_path')
            .eq('id', req.user_video_id)
            .single();

          return {
            ...req,
            user_profile: profile,
            video
          } as FeedbackRequest;
        })
      );

      setRequests(requestsWithDetails);
    } catch (error) {
      console.error('Error fetching feedback requests:', error);
      toast({
        title: 'Fehler',
        description: 'Feedback-Anfragen konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleOpenRequest = async (request: FeedbackRequest) => {
    setSelectedRequest(request);
    
    if (request.video?.storage_path) {
      const { data } = await supabase.storage
        .from('recordings')
        .createSignedUrl(request.video.storage_path, 3600);
      setVideoUrl(data?.signedUrl || null);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: 'open' | 'answered' | 'closed') => {
    try {
      const { error } = await supabase
        .from('admin_feedback_requests')
        .update({ status })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Status aktualisiert',
        description: `Anfrage wurde als "${status}" markiert.`
      });

      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht aktualisiert werden.',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="destructive">Offen</Badge>;
      case 'answered':
        return <Badge variant="default" className="bg-green-500">Beantwortet</Badge>;
      case 'closed':
        return <Badge variant="secondary">Geschlossen</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Feedback & Chats</h2>
        <Badge variant="outline">{requests.filter(r => r.status === 'open').length} offen</Badge>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Keine Feedback-Anfragen vorhanden</p>
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Erstellt</TableHead>
                <TableHead>Letzte Aktivität</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={request.user_profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {request.user_profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {request.user_profile?.display_name || 'Unbekannt'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">
                        {request.video?.title || 'Video'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: de })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(request.updated_at), { addSuffix: true, locale: de })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRequest(request)}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Öffnen
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Feedback-Anfrage</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* User info */}
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedRequest.user_profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedRequest.user_profile?.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {selectedRequest.user_profile?.display_name || 'Unbekannt'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedRequest.created_at), { addSuffix: true, locale: de })}
                  </p>
                </div>
                <div className="ml-auto">
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {/* User message */}
              {selectedRequest.message && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Nachricht:</p>
                  <p>{selectedRequest.message}</p>
                </div>
              )}

              {/* Video */}
              {videoUrl && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Video:</p>
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    className="w-full rounded-lg bg-black"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedRequest.chat_id && (
                  <Button
                    onClick={() => {
                      window.location.href = `/chats?id=${selectedRequest.chat_id}`;
                    }}
                    className="gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Zum Chat
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'answered')}
                  disabled={selectedRequest.status === 'answered'}
                >
                  Als beantwortet markieren
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus(selectedRequest.id, 'closed')}
                  disabled={selectedRequest.status === 'closed'}
                >
                  Schließen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
