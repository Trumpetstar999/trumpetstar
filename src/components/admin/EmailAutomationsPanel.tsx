import { useState } from 'react';
import { GitBranch, Mail, List, Clock, Users, Send } from 'lucide-react';
import { FlowsTab } from './marketing/FlowsTab';
import { SegmentsTab } from './marketing/SegmentsTab';
import { SequencesTab } from './marketing/SequencesTab';
import { TemplatesMarketingTab } from './marketing/TemplatesMarketingTab';
import { EmailLogTab } from './marketing/EmailLogTab';
import { QueueTab } from './marketing/QueueTab';

type SubTab = 'flows' | 'sequences' | 'templates' | 'log' | 'queue' | 'segments';

const TABS: { id: SubTab; label: string; icon: any }[] = [
  { id: 'flows', label: 'Flows', icon: GitBranch },
  { id: 'sequences', label: 'Sequenzen', icon: List },
  { id: 'templates', label: 'Templates', icon: Mail },
  { id: 'log', label: 'E-Mail Log', icon: Send },
  { id: 'queue', label: 'Warteschlange', icon: Clock },
  { id: 'segments', label: 'Segmente', icon: Users },
];

export function EmailAutomationsPanel() {
  const [activeTab, setActiveTab] = useState<SubTab>('flows');

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

      {activeTab === 'flows' && <FlowsTab />}
      {activeTab === 'sequences' && <SequencesTab />}
      {activeTab === 'templates' && <TemplatesMarketingTab />}
      {activeTab === 'log' && <EmailLogTab />}
      {activeTab === 'queue' && <QueueTab />}
      {activeTab === 'segments' && <SegmentsTab />}
    </div>
  );
}
