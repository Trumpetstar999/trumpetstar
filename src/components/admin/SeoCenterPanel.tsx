import { useState } from 'react';
import { Search, Globe, Link2, BarChart2, FileText } from 'lucide-react';
import { KeywordMap } from './seo/KeywordMap';
import { ContentPlan } from './seo/ContentPlan';
import { ArticleOS } from './seo/ArticleOS';
import { LinkTasks } from './seo/LinkTasks';

type SubTab = 'keywords' | 'plan' | 'articles' | 'links';

const TABS: { id: SubTab; label: string; icon: any }[] = [
  { id: 'keywords', label: 'Keyword Map', icon: Globe },
  { id: 'plan', label: 'Content Plan', icon: BarChart2 },
  { id: 'articles', label: 'Article OS', icon: FileText },
  { id: 'links', label: 'Link Tasks', icon: Link2 },
];

export function SeoCenterPanel() {
  const [activeTab, setActiveTab] = useState<SubTab>('keywords');

  return (
    <div className="space-y-6">
      <div className="admin-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`admin-tab ${activeTab === t.id ? 'admin-tab-active' : ''}`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'keywords' && <KeywordMap />}
      {activeTab === 'plan' && <ContentPlan />}
      {activeTab === 'articles' && <ArticleOS />}
      {activeTab === 'links' && <LinkTasks />}
    </div>
  );
}
