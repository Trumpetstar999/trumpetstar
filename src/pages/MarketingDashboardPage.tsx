import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, Users, TrendingUp, Eye, MousePointer, 
  Send, Clock, AlertCircle, CheckCircle, Search,
  Filter, Download, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';

interface Lead {
  id: string;
  email: string;
  first_name: string;
  segment_id: string;
  status: string;
  activity_score: number;
  created_at: string;
  purchased: boolean;
}

interface EmailLog {
  id: string;
  lead_id: string;
  subject_used: string;
  sent_at: string;
  opened_at?: string;
  clicked_at?: string;
  was_modified_by_bot: boolean;
}

interface Stats {
  totalLeads: number;
  activeSequences: number;
  emailsSent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
}

export default function MarketingDashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    activeSequences: 0,
    emailsSent: 0,
    openRate: 0,
    clickRate: 0,
    conversionRate: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    // Leads laden
    const { data: leadsData } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    
    // Email Logs laden
    const { data: logsData } = await supabase
      .from('lead_email_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(100);
    
    // Stats berechnen
    const totalLeads = leadsData?.length || 0;
    const emailsSent = logsData?.length || 0;
    const opened = logsData?.filter(l => l.opened_at).length || 0;
    const clicked = logsData?.filter(l => l.clicked_at).length || 0;
    const purchased = leadsData?.filter(l => l.purchased).length || 0;
    
    setStats({
      totalLeads,
      activeSequences: 3, // Hardcoded für Demo
      emailsSent,
      openRate: emailsSent ? Math.round((opened / emailsSent) * 100) : 0,
      clickRate: emailsSent ? Math.round((clicked / emailsSent) * 100) : 0,
      conversionRate: totalLeads ? Math.round((purchased / totalLeads) * 100) : 0
    });
    
    setLeads(leadsData || []);
    setLogs(logsData || []);
    setLoading(false);
  }

  const filteredLeads = leads.filter(lead => 
    lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.first_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      engaged: 'bg-purple-100 text-purple-800',
      converted: 'bg-amber-100 text-amber-800',
      dormant: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={colors[status] || colors.new}>{status}</Badge>;
  }

  function getEngagementIcon(log: EmailLog) {
    if (log.clicked_at) return <MousePointer className="h-4 w-4 text-green-600" />;
    if (log.opened_at) return <Eye className="h-4 w-4 text-blue-600" />;
    return <Send className="h-4 w-4 text-gray-400" />;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketing Automation Dashboard</h1>
        <p className="text-muted-foreground">
          E-Mail-Sequenzen, Lead-Verlauf und Conversion-Tracking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamte Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSequences} aktive Sequenzen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">E-Mails versendet</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.emailsSent}</div>
            <p className="text-xs text-muted-foreground">
              Letzte 24h: {Math.round(stats.emailsSent / 30)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openRate}%</div>
            <p className="text-xs text-muted-foreground">
              Branchenschnitt: 25%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clickRate}%</div>
            <p className="text-xs text-muted-foreground">
              Branchenschnitt: 3%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Kauf/Abo nach E-Mail
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bot-Optimierungen</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => l.was_modified_by_bot).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Dynamische Anpassungen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="leads" className="space-y-6">
        <TabsList>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="emails">E-Mail-Verlauf</TabsTrigger>
          <TabsTrigger value="sequences">Sequenzen</TabsTrigger>
        </TabsList>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lead-Übersicht</CardTitle>
                <div className="flex gap-2">
                  <Input
                    placeholder="Suche nach E-Mail..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Eingang</TableHead>
                    <TableHead>Kauf</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.email}</TableCell>
                      <TableCell>{lead.first_name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${Math.min(lead.activity_score * 10, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">{lead.activity_score}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(lead.created_at).toLocaleDateString('de-DE')}
                      </TableCell>
                      <TableCell>
                        {lead.purchased ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emails Tab */}
        <TabsContent value="emails">
          <Card>
            <CardHeader>
              <CardTitle>E-Mail-Verlauf (1:1 Tracking)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Betreff</TableHead>
                    <TableHead>Gesendet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bot</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium max-w-md truncate">
                        {log.subject_used}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(log.sent_at).toLocaleString('de-DE')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEngagementIcon(log)}
                          <span className="text-sm">
                            {log.clicked_at ? 'Geklickt' : 
                             log.opened_at ? 'Geöffnet' : 'Gesendet'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.was_modified_by_bot && (
                          <Badge variant="outline" className="text-amber-600">
                            Optimiert
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sequences Tab */}
        <TabsContent value="sequences">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>7-Tage Willkommen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Für erwachsene Anfänger und Wiedereinsteiger
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4" />
                    <span>Tag 0, 1, 3, 5, 7</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span> aktiv</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7-Tage Eltern</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Für Eltern mit Kindern (6-14 Jahre)
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4" />
                    <span>Tag 0, 1, 3, 5, 7</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span> aktiv</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5-Tage B2B</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Für Musiklehrer und Dirigenten
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4" />
                    <span>Tag 0, 2, 4</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span> aktiv</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Refresh Button */}
      <div className="mt-8 flex justify-end">
        <Button onClick={loadData} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Daten aktualisieren
        </Button>
      </div>
    </div>
  );
}
