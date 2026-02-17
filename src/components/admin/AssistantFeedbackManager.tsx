import { useState } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Check, X, Search, Loader2, HelpCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UnansweredQuestion {
  id: string;
  user_id: string;
  question: string;
  detected_intent: string | null;
  language: 'de' | 'en' | null;
  status: 'pending' | 'answered' | 'dismissed';
  admin_response: string | null;
  created_at: string;
  resolved_at: string | null;
}

interface MessageFeedback {
  id: string;
  content: string;
  feedback: 'positive' | 'negative';
  created_at: string;
}

export function AssistantFeedbackManager() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'unanswered' | 'feedback'>('unanswered');
  const [searchTerm, setSearchTerm] = useState('');
  const [respondingTo, setRespondingTo] = useState<UnansweredQuestion | null>(null);
  const [responseText, setResponseText] = useState('');

  // Fetch unanswered questions
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['unanswered-questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assistant_unanswered_questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UnansweredQuestion[];
    },
  });

  // Fetch messages with feedback
  const { data: feedbackMessages = [], isLoading: feedbackLoading } = useQuery({
    queryKey: ['assistant-feedback'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assistant_messages')
        .select('id, content, feedback, created_at')
        .not('feedback', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as MessageFeedback[];
    },
  });

  // Update question status
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, status, response }: { id: string; status: string; response?: string }) => {
      const { error } = await supabase
        .from('assistant_unanswered_questions')
        .update({
          status,
          admin_response: response || null,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unanswered-questions'] });
      toast.success('Frage aktualisiert');
      setRespondingTo(null);
      setResponseText('');
    },
    onError: (error) => {
      toast.error('Fehler: ' + (error as Error).message);
    },
  });

  const pendingQuestions = questions.filter(q => q.status === 'pending');
  const answeredQuestions = questions.filter(q => q.status !== 'pending');

  const positiveCount = feedbackMessages.filter(m => m.feedback === 'positive').length;
  const negativeCount = feedbackMessages.filter(m => m.feedback === 'negative').length;

  const filteredQuestions = pendingQuestions.filter(q =>
    q.question.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const downloadCSV = () => {
    const rows = questions.map(q => ({
      Datum: new Date(q.created_at).toLocaleDateString('de-DE'),
      Frage: q.question,
      Status: q.status,
      Intent: q.detected_intent || '',
      Sprache: q.language || '',
      Antwort: q.admin_response || '',
    }));
    const header = Object.keys(rows[0] || {}).join(';');
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `unbeantwortete-fragen-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{pendingQuestions.length}</div>
          <div className="text-sm text-slate-500">Unbeantwortete Fragen</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-slate-600">{answeredQuestions.length}</div>
          <div className="text-sm text-slate-500">Bearbeitet</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{positiveCount}</div>
          <div className="text-sm text-slate-500">Positive Bewertungen</div>
        </div>
        <div className="admin-card p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{negativeCount}</div>
          <div className="text-sm text-slate-500">Negative Bewertungen</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          onClick={() => setActiveTab('unanswered')}
          className={`admin-tab ${activeTab === 'unanswered' ? 'admin-tab-active' : ''}`}
        >
          <HelpCircle className="w-4 h-4" />
          Unbeantwortete Fragen
          {pendingQuestions.length > 0 && (
            <Badge variant="destructive" className="ml-2">{pendingQuestions.length}</Badge>
          )}
        </button>
        <button
          onClick={() => setActiveTab('feedback')}
          className={`admin-tab ${activeTab === 'feedback' ? 'admin-tab-active' : ''}`}
        >
          <MessageSquare className="w-4 h-4" />
          Feedback-Übersicht
        </button>
      </div>

      {activeTab === 'unanswered' && (
        <div className="space-y-4">
          {/* Search + Download */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Fragen durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCSV}
              disabled={questions.length === 0}
            >
              <Download className="w-4 h-4 mr-1" />
              CSV Download
            </Button>
          </div>

          {/* Questions List */}
          <div className="admin-card overflow-hidden">
            {questionsLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <HelpCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Keine unbeantworteten Fragen</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredQuestions.map((question) => (
                  <div key={question.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-sm text-slate-900 mb-2">{question.question}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{new Date(question.created_at).toLocaleDateString('de-DE')}</span>
                          {question.detected_intent && (
                            <Badge variant="secondary">{question.detected_intent}</Badge>
                          )}
                          {question.language && (
                            <Badge variant="outline" className="uppercase">{question.language}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRespondingTo(question)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Antworten
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-slate-600"
                          onClick={() => updateQuestionMutation.mutate({ 
                            id: question.id, 
                            status: 'dismissed' 
                          })}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="admin-card overflow-hidden">
          {feedbackLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
            </div>
          ) : feedbackMessages.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>Noch kein Feedback erhalten</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {feedbackMessages.map((message) => (
                <div key={message.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full ${
                      message.feedback === 'positive' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {message.feedback === 'positive' ? (
                        <ThumbsUp className="w-4 h-4" />
                      ) : (
                        <ThumbsDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-900 line-clamp-3">{message.content}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(message.created_at).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={(open) => !open && setRespondingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Antwort hinzufügen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">{respondingTo?.question}</p>
            </div>

            <div className="space-y-2">
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Diese Antwort wird zur Wissensbasis hinzugefügt..."
                className="min-h-[120px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingTo(null)}>
              Abbrechen
            </Button>
            <Button
              onClick={() => {
                if (respondingTo) {
                  updateQuestionMutation.mutate({
                    id: respondingTo.id,
                    status: 'answered',
                    response: responseText,
                  });
                }
              }}
              disabled={!responseText.trim() || updateQuestionMutation.isPending}
            >
              {updateQuestionMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
