import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { GripVertical, RotateCcw, Pencil, X, Crown, Scale } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDashboardLayout, WidgetId } from '@/hooks/useDashboardLayout';
import { useLanguage } from '@/hooks/useLanguage';
import { useMembership } from '@/hooks/useMembership';
import { useNavigate } from 'react-router-dom';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { ProfileWidget } from '@/components/dashboard/widgets/ProfileWidget';
import { StarsProgressWidget } from '@/components/dashboard/widgets/StarsProgressWidget';
import { WeeklyStarsWidget } from '@/components/dashboard/widgets/WeeklyStarsWidget';
import { RecordingsWidget } from '@/components/dashboard/widgets/RecordingsWidget';
import { NotesTodosWidget } from '@/components/dashboard/widgets/NotesTodosWidget';
import { FeedbackChatWidget } from '@/components/dashboard/widgets/FeedbackChatWidget';
import { ClassroomWidget } from '@/components/dashboard/widgets/ClassroomWidget';
import { StatisticsWidget } from '@/components/dashboard/widgets/StatisticsWidget';
import { GameHighscoreWidget } from '@/components/dashboard/widgets/GameHighscoreWidget';
import { PracticeSessionsWidget } from '@/components/dashboard/widgets/PracticeSessionsWidget';
import { LanguageSelector } from '@/components/settings/LanguageSelector';

function WidgetContent({ id }: { id: WidgetId }) {
  switch (id) {
    case 'profile':
      return <ProfileWidget />;
    case 'stars-progress':
      return <StarsProgressWidget />;
    case 'calendar':
      return <WeeklyStarsWidget />;
    case 'recordings':
      return <RecordingsWidget />;
    case 'notes-todo':
      return <NotesTodosWidget />;
    case 'feedback-chat':
      return <FeedbackChatWidget />;
    case 'classroom':
      return <ClassroomWidget />;
    case 'statistics':
      return <StatisticsWidget />;
    case 'game-highscore':
      return <GameHighscoreWidget />;
    case 'practice-sessions':
      return <PracticeSessionsWidget />;
    default:
      return <div className="text-white/50 text-center py-8">Widget kommt bald...</div>;
  }
}

export function ProfilePage() {
  const { t } = useLanguage();
  const { planKey } = useMembership();
  const navigate = useNavigate();
  const {
    visibleWidgets,
    isEditing,
    setIsEditing,
    reorderWidgets,
    resetLayout,
  } = useDashboardLayout();

  const getWidgetTitle = (id: WidgetId): string => {
    const keyMap: Record<string, string> = {
      'stars-progress': 'starsProgress',
      'notes-todo': 'notesTodo',
      'feedback-chat': 'feedbackChat',
      'recent-videos': 'recentVideos',
      'weekly-goals': 'weeklyGoals',
      'game-highscore': 'gameHighscore',
      'practice-sessions': 'practiceSessions',
    };
    return t(`widgets.${keyMap[id] || id}`);
  };

  const getUpgradeButtonText = () => {
    if (planKey === 'PRO') return null;
    if (planKey === 'BASIC') return 'Pro freischalten';
    return 'Pricing';
  };

  const upgradeText = getUpgradeButtonText();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderWidgets(active.id as WidgetId, over.id as WidgetId);
    }
  };

  return (
    <div className="h-full overflow-auto px-4 py-6 lg:px-8">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('profile.dashboard')}</h1>
          <p className="text-white/60 text-sm">{t('profile.personalOverview')}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button onClick={resetLayout} variant="ghost" size="sm" className="text-white/60 hover:text-white hover:bg-white/10">
              <RotateCcw className="w-4 h-4 mr-2" />
              {t('profile.reset')}
            </Button>
          )}
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'default' : 'ghost'}
            size="sm"
            className={isEditing ? 'bg-accent-red hover:bg-accent-red/90 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}
          >
            {isEditing ? <><X className="w-4 h-4 mr-2" />{t('profile.done')}</> : <><Pencil className="w-4 h-4 mr-2" />{t('profile.arrangeWidgets')}</>}
          </Button>
        </div>
      </div>

      {/* Language Selector + Upgrade Button */}
      <div className="mb-6 flex items-center gap-4">
        <div className="max-w-xs">
          <LanguageSelector />
        </div>
        {upgradeText && (
          <Button
            onClick={() => navigate('/pricing')}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold"
            size="sm"
          >
            <Crown className="w-4 h-4 mr-2" />
            {upgradeText}
          </Button>
        )}
      </div>

      {isEditing && (
        <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 animate-fade-in">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <GripVertical className="w-4 h-4 animate-pulse" />
            <span>{t('profile.dragHint')}</span>
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={visibleWidgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-4">
            {visibleWidgets.map((widget, index) => (
              <DashboardWidget
                key={widget.id}
                id={widget.id}
                title={getWidgetTitle(widget.id)}
                isEditing={isEditing}
                index={index}
                className={widget.id === 'profile' ? 'md:row-span-1' : widget.id === 'calendar' ? 'lg:col-span-1' : ''}
              >
                <WidgetContent id={widget.id} />
              </DashboardWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <p className="text-center text-white/40 text-xs mt-8">{t('profile.premiumHint')}</p>

      {/* Impressum */}
      <div className="flex justify-center mt-4 mb-8">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white/30 hover:text-white/60 text-xs gap-1.5">
              <Scale className="w-3 h-3" />
              Impressum
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Impressum</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Trumpetstar GmbH</p>
                  <p>Verlag für Buch, Kunst und Musikalien</p>
                  <p>Geschäftsführer: Mario Schulter, MA</p>
                  <p>Mogersdorf 253, 8382 Mogersdorf, Österreich</p>
                </div>
                <div>
                  <p>UID-Nr. (AT): ATU81038878</p>
                  <p>UID-Nr. (DE): DE442429470</p>
                  <p>Firmenbuch: FN 633951g</p>
                </div>
                <div>
                  <p>Tel.: +43 677 / 628 053 57</p>
                  <p>E-Mail: info@trumpetstar.com</p>
                  <p>Web: www.trumpetstar.com</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Online-Streitbeilegung</p>
                  <p>
                    Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{' '}
                    <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      ec.europa.eu/consumers/odr
                    </a>. Beschwerden können auch direkt per E-Mail an uns gerichtet werden.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Haftungshinweis</p>
                  <p>
                    Trotz sorgfältiger Prüfung übernehmen wir keine Gewähr für die Richtigkeit, Vollständigkeit oder Aktualität der bereitgestellten Inhalte. Für verlinkte externe Seiten sind ausschließlich deren Betreiber verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden betroffene Inhalte umgehend entfernt.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Urheberrecht</p>
                  <p>
                    Sämtliche Inhalte dieser Anwendung – insbesondere Texte, Bilder, Grafiken und Videos – sind urheberrechtlich geschützt. Jede nicht autorisierte Verwendung wird verfolgt.
                  </p>
                </div>
                <p className="text-xs text-muted-foreground/60 pt-2">
                  Angaben gemäß §5 ECG, §14 UGB, §63 GewO, §25 MedienG
                </p>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
