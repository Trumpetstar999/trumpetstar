import { usePracticeSessions } from '@/hooks/usePracticeSessions';
import { Button } from '@/components/ui/button';
import { Music, Play, Plus, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PracticeSessionsWidget() {
  const { sessions, isLoading } = usePracticeSessions();
  const navigate = useNavigate();

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return m < 60 ? `~${m} Min.` : `~${Math.floor(m / 60)}h ${m % 60}m`;
  };

  const recentSessions = sessions.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">Meine Übesessions</h3>
        </div>
        <span className="text-white/70 text-sm">{sessions.length} Sessions</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : recentSessions.length > 0 ? (
        <div className="space-y-2 mb-4">
          {recentSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => navigate(`/practice/sessions/${session.id}/play`)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0 group-hover:bg-purple-500/30 transition-colors">
                <Play className="w-4 h-4 text-purple-300 ml-0.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{session.name}</p>
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(session.estimatedDuration)}
                  </span>
                  <span>{session.itemCount} Items</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center">
            <Music className="w-6 h-6 text-white/50" />
          </div>
          <p className="text-white/70 text-sm">Noch keine Übesessions</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => navigate('/practice/sessions')}
          variant="ghost"
          size="sm"
          className="flex-1 text-white hover:text-white hover:bg-white/20 bg-white/10"
        >
          Alle Sessions
        </Button>
        <Button
          onClick={() => navigate('/practice/sessions/new')}
          variant="ghost"
          size="sm"
          className="text-white hover:text-white hover:bg-white/20 bg-white/10"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
