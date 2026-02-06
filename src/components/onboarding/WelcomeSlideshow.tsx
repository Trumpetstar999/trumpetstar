import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  FileText, 
  Music, 
  BookOpen, 
  Video, 
  MessageCircle, 
  Users,
  ChevronLeft,
  ChevronRight,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface WelcomeSlideshowProps {
  open: boolean;
  onComplete: () => void;
}

interface Slide {
  icon: React.ReactNode;
  titleKey: string;
  descriptionKey: string;
  color: string;
}

const slides: Slide[] = [
  {
    icon: <Star className="w-16 h-16" />,
    titleKey: 'welcome.slides.welcome.title',
    descriptionKey: 'welcome.slides.welcome.description',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: <GraduationCap className="w-16 h-16" />,
    titleKey: 'welcome.slides.levels.title',
    descriptionKey: 'welcome.slides.levels.description',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: <FileText className="w-16 h-16" />,
    titleKey: 'welcome.slides.pdfs.title',
    descriptionKey: 'welcome.slides.pdfs.description',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: <Music className="w-16 h-16" />,
    titleKey: 'welcome.slides.musicxml.title',
    descriptionKey: 'welcome.slides.musicxml.description',
    color: 'from-purple-500 to-violet-500',
  },
  {
    icon: <BookOpen className="w-16 h-16" />,
    titleKey: 'welcome.slides.practice.title',
    descriptionKey: 'welcome.slides.practice.description',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: <Video className="w-16 h-16" />,
    titleKey: 'welcome.slides.recordings.title',
    descriptionKey: 'welcome.slides.recordings.description',
    color: 'from-red-500 to-orange-500',
  },
  {
    icon: <MessageCircle className="w-16 h-16" />,
    titleKey: 'welcome.slides.chats.title',
    descriptionKey: 'welcome.slides.chats.description',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: <Users className="w-16 h-16" />,
    titleKey: 'welcome.slides.classroom.title',
    descriptionKey: 'welcome.slides.classroom.description',
    color: 'from-teal-500 to-green-500',
  },
];

export function WelcomeSlideshow({ open, onComplete }: WelcomeSlideshowProps) {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [isAnimating, setIsAnimating] = useState(false);

  // Reset to first slide when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentSlide(0);
    }
  }, [open]);

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    
    setDirection(index > currentSlide ? 'right' : 'left');
    setIsAnimating(true);
    
    setTimeout(() => {
      setCurrentSlide(index);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 150);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      goToSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];
  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md max-h-[90vh] overflow-hidden p-0 gap-0 [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="relative">
          {/* Background gradient */}
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-90 transition-all duration-500",
              slide.color
            )}
          />
          
          {/* Content */}
          <div className="relative z-10 p-8 pt-10 text-white">
            {/* Slide content */}
            <div 
              className={cn(
                "flex flex-col items-center text-center transition-all duration-300 ease-out min-h-[280px]",
                isAnimating && direction === 'right' && "opacity-0 -translate-x-4",
                isAnimating && direction === 'left' && "opacity-0 translate-x-4",
                !isAnimating && "opacity-100 translate-x-0"
              )}
            >
              {/* Icon */}
              <div className="mb-6 p-4 bg-white/20 rounded-full backdrop-blur-sm">
                {slide.icon}
              </div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold mb-3">
                {t(slide.titleKey)}
              </h2>
              
              {/* Description */}
              <p className="text-white/90 text-base leading-relaxed max-w-sm">
                {t(slide.descriptionKey)}
              </p>
            </div>
            
            {/* Dots indicator */}
            <div className="flex justify-center gap-2 mt-6 mb-4">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === currentSlide 
                      ? "bg-white w-6" 
                      : "bg-white/40 hover:bg-white/60"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Navigation buttons */}
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="text-white hover:bg-white/20 disabled:opacity-30"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <Button
                onClick={nextSlide}
                className={cn(
                  "px-8 py-2 rounded-full font-semibold transition-all",
                  isLastSlide 
                    ? "bg-white text-gray-900 hover:bg-gray-100" 
                    : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                )}
              >
                {isLastSlide ? t('welcome.start') : t('welcome.next')}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={nextSlide}
                disabled={isLastSlide}
                className="text-white hover:bg-white/20 disabled:opacity-30"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
            
            {/* Skip button */}
            {!isLastSlide && (
              <button
                onClick={onComplete}
                className="w-full mt-4 text-white/70 hover:text-white text-sm transition-colors"
              >
                {t('welcome.skip')}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
