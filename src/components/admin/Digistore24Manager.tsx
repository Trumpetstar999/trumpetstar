import { useState } from 'react';
import { Settings, Package, FileText } from 'lucide-react';
import { Digistore24SettingsManager } from './Digistore24SettingsManager';
import { Digistore24ProductsManager } from './Digistore24ProductsManager';
import { Digistore24IPNLogs } from './Digistore24IPNLogs';

type SubTab = 'settings' | 'products' | 'logs';

export function Digistore24Manager() {
  const [subTab, setSubTab] = useState<SubTab>('settings');

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="admin-tabs">
        <button
          onClick={() => setSubTab('settings')}
          className={`admin-tab ${subTab === 'settings' ? 'admin-tab-active' : ''}`}
        >
          <Settings className="w-4 h-4" />
          Einstellungen
        </button>
        <button
          onClick={() => setSubTab('products')}
          className={`admin-tab ${subTab === 'products' ? 'admin-tab-active' : ''}`}
        >
          <Package className="w-4 h-4" />
          Produkte
        </button>
        <button
          onClick={() => setSubTab('logs')}
          className={`admin-tab ${subTab === 'logs' ? 'admin-tab-active' : ''}`}
        >
          <FileText className="w-4 h-4" />
          IPN Logs
        </button>
      </div>

      {/* Content */}
      {subTab === 'settings' && <Digistore24SettingsManager />}
      {subTab === 'products' && <Digistore24ProductsManager />}
      {subTab === 'logs' && <Digistore24IPNLogs />}
    </div>
  );
}
