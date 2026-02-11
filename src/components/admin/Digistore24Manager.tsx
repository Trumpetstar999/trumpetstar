import { useState, useCallback } from 'react';
import { Settings, Package, FileText, Download } from 'lucide-react';
import { Digistore24SettingsManager } from './Digistore24SettingsManager';
import { Digistore24ProductsManager } from './Digistore24ProductsManager';
import { Digistore24IPNLogs } from './Digistore24IPNLogs';
import { Digistore24ImportPanel } from './Digistore24ImportPanel';

type SubTab = 'settings' | 'products' | 'import' | 'logs';

export function Digistore24Manager() {
  const [subTab, setSubTab] = useState<SubTab>('settings');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleImportDone = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

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
          onClick={() => setSubTab('import')}
          className={`admin-tab ${subTab === 'import' ? 'admin-tab-active' : ''}`}
        >
          <Download className="w-4 h-4" />
          Import
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
      {subTab === 'import' && <Digistore24ImportPanel onImportDone={handleImportDone} />}
      {subTab === 'products' && <Digistore24ProductsManager key={refreshKey} />}
      {subTab === 'logs' && <Digistore24IPNLogs />}
    </div>
  );
}
