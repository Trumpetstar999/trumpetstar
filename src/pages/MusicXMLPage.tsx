import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { useLanguage, useLocalizedContent, Language } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageTabs } from '@/components/common/LanguageTabs';
import { Loader2, FileMusic, Search, Lock, Music, ChevronRight } from 'lucide-react';
import { PlanKey, PLAN_DISPLAY_NAMES } from '@/types/plans';
import { toast } from 'sonner';
interface MusicXMLDocument {
  id: string;
  level_id: string | null;
  title: string;
  title_en?: string | null;
  title_es?: string | null;
  category: string | null;
  category_en?: string | null;
  category_es?: string | null;
  plan_required: string;
  xml_file_url: string;
  is_active: boolean;
  sort_index: number;
  created_at: string;
  language?: string | null;
  levels?: {
    title: string;
  } | null;
}
interface Level {
  id: string;
  title: string;
}
export function MusicXMLPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canAccessLevel, isLoading: membershipLoading } = useMembership();
  const { t } = useLanguage();
  const { getLocalizedField } = useLocalizedContent();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contentLanguage, setContentLanguage] = useState<Language>('de');

  // Fetch MusicXML documents
  const {
    data: documents = [],
    isLoading: docsLoading
  } = useQuery({
    queryKey: ['user-musicxml'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('musicxml_documents').select('*, levels(title)').eq('is_active', true).order('sort_index', {
        ascending: true
      });
      if (error) throw error;
      return data as MusicXMLDocument[];
    },
    enabled: !!user
  });

  // Fetch levels
  const {
    data: levels = []
  } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('levels').select('id, title').eq('is_active', true).order('sort_order', {
        ascending: true
      });
      if (error) throw error;
      return data as Level[];
    }
  });

  // Get unique categories with localized names
  const categories = [...new Set(documents.filter(d => d.category).map(d => getLocalizedField(d, 'category')))];

  // Filter documents with localization support
  const filteredDocs = documents.filter(doc => {
    const localizedTitle = getLocalizedField(doc, 'title');
    const localizedCategory = getLocalizedField(doc, 'category');
    
    const matchesSearch = localizedTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
      localizedCategory?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || doc.level_id === selectedLevel;
    const matchesCategory = selectedCategory === 'all' || localizedCategory === selectedCategory;
    
    // Content language filter
    const matchesLanguage = contentLanguage === 'de' || 
      !doc.language || 
      doc.language === contentLanguage ||
      doc.language === 'all';
    
    return matchesSearch && matchesLevel && matchesCategory && matchesLanguage;
  });
  const isLoading = docsLoading || membershipLoading;
  const handleOpenDocument = (doc: MusicXMLDocument) => {
    if (!canAccessLevel(doc.plan_required as PlanKey)) {
      toast.error(`Upgrade auf ${PLAN_DISPLAY_NAMES[doc.plan_required as PlanKey]} erforderlich`);
      return;
    }
    navigate(`/musicxml/${doc.id}`);
  };
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (documents.length === 0) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileMusic className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">{t('musicxml.noDocuments')}</p>
          <p className="text-sm">{t('musicxml.noDocumentsDesc')}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b bg-card/50">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileMusic className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t('musicxml.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('musicxml.available', { count: documents.length })}</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
            {/* Language Tabs */}
            <LanguageTabs
              selectedLanguage={contentLanguage}
              onLanguageChange={setContentLanguage}
              variant="compact"
              className="bg-muted/50 border border-border"
            />
            
            <div className="relative flex-1 md:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={t('musicxml.searchPlaceholder')} 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="pl-9 h-9" 
              />
            </div>
            
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('musicxml.allLevels')}</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {categories.length > 0 && (
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('musicxml.allCategories')}</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Documents List */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="grid gap-3">
            {filteredDocs.map(doc => {
              const hasAccess = canAccessLevel(doc.plan_required as PlanKey);
              const localizedTitle = getLocalizedField(doc, 'title');
              const localizedCategory = getLocalizedField(doc, 'category');
              
              return (
                <Card 
                  key={doc.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${!hasAccess ? 'opacity-75' : ''}`} 
                  onClick={() => handleOpenDocument(doc)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${hasAccess ? 'bg-primary/10' : 'bg-muted'}`}>
                        {hasAccess ? <Music className="w-6 h-6 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{localizedTitle}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {doc.levels?.title && <span>{doc.levels.title}</span>}
                          {localizedCategory && (
                            <>
                              <span>•</span>
                              <span>{localizedCategory}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Badges & Arrow */}
                      <div className="flex items-center gap-3 shrink-0">
                        {doc.plan_required !== 'FREE' && (
                          <Badge variant={hasAccess ? 'secondary' : 'outline'} className={!hasAccess ? 'border-amber-500 text-amber-600' : ''}>
                            {PLAN_DISPLAY_NAMES[doc.plan_required as PlanKey]}
                          </Badge>
                        )}
                        <ChevronRight className={`w-5 h-5 ${hasAccess ? 'text-muted-foreground' : 'text-muted-foreground/50'}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredDocs.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <FileMusic className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('musicxml.noDocumentsFound')}</p>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}