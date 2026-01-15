import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserPlus, Users, GraduationCap, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Teacher {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Student {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  teacher_id: string | null;
  assignment_id: string | null;
  assigned_at: string | null;
}

export function TeacherAssignmentManager() {
  const { toast } = useToast();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch teachers (users with is_teacher = true)
      const { data: teacherData, error: teacherError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('is_teacher', true);

      if (teacherError) throw teacherError;
      setTeachers(teacherData || []);

      // Fetch all users (non-teachers)
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, is_teacher')
        .eq('is_teacher', false);

      if (studentError) throw studentError;

      // Fetch existing assignments
      const { data: assignments, error: assignError } = await supabase
        .from('teacher_assignments')
        .select('*')
        .eq('is_active', true);

      if (assignError) throw assignError;

      // Merge student data with assignments
      const studentsWithAssignments = (studentData || []).map(student => {
        const assignment = assignments?.find(a => a.user_id === student.id);
        return {
          ...student,
          teacher_id: assignment?.teacher_id || null,
          assignment_id: assignment?.id || null,
          assigned_at: assignment?.assigned_at || null
        };
      });

      setStudents(studentsWithAssignments);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Fehler',
        description: 'Daten konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async () => {
    if (!selectedStudent || !selectedTeacherId) return;

    setSaving(true);
    try {
      // If there's an existing assignment, deactivate it
      if (selectedStudent.assignment_id) {
        await supabase
          .from('teacher_assignments')
          .update({ is_active: false })
          .eq('id', selectedStudent.assignment_id);
      }

      // Create new assignment
      const { error } = await supabase
        .from('teacher_assignments')
        .insert({
          user_id: selectedStudent.id,
          teacher_id: selectedTeacherId,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Lehrer zugewiesen',
        description: 'Die Zuweisung wurde erfolgreich gespeichert.'
      });

      setAssignDialogOpen(false);
      setSelectedStudent(null);
      setSelectedTeacherId('');
      fetchData();
    } catch (error) {
      console.error('Error assigning teacher:', error);
      toast({
        title: 'Fehler',
        description: 'Zuweisung konnte nicht gespeichert werden.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (student: Student) => {
    if (!student.assignment_id) return;

    try {
      const { error } = await supabase
        .from('teacher_assignments')
        .update({ is_active: false })
        .eq('id', student.assignment_id);

      if (error) throw error;

      toast({
        title: 'Zuweisung entfernt',
        description: 'Der Lehrer wurde vom Schüler entfernt.'
      });

      fetchData();
    } catch (error) {
      console.error('Error removing assignment:', error);
      toast({
        title: 'Fehler',
        description: 'Zuweisung konnte nicht entfernt werden.',
        variant: 'destructive'
      });
    }
  };

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.display_name || 'Unbekannt';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lehrer-Zuweisung</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Weise Schülern ihren persönlichen Lehrer zu
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="gap-1">
            <GraduationCap className="w-3 h-3" />
            {teachers.length} Lehrer
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Users className="w-3 h-3" />
            {students.length} Schüler
          </Badge>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Keine Schüler vorhanden</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Schüler</TableHead>
                <TableHead>Zugewiesener Lehrer</TableHead>
                <TableHead>Zugewiesen seit</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={student.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {student.display_name?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {student.display_name || 'Unbenannt'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {student.teacher_id ? (
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-primary" />
                        <span>{getTeacherName(student.teacher_id)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Kein Lehrer</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {student.assigned_at ? (
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(student.assigned_at), { addSuffix: true, locale: de })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {student.teacher_id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveAssignment(student)}
                          title="Zuweisung entfernen"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(student);
                          setSelectedTeacherId(student.teacher_id || '');
                          setAssignDialogOpen(true);
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        {student.teacher_id ? 'Ändern' : 'Zuweisen'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      )}

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Lehrer zuweisen</DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <Avatar>
                  <AvatarImage src={selectedStudent.avatar_url || undefined} />
                  <AvatarFallback>
                    {selectedStudent.display_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedStudent.display_name || 'Unbenannt'}</p>
                  <p className="text-sm text-muted-foreground">Schüler</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lehrer auswählen</label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lehrer wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.display_name || 'Unbenannt'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {teachers.length === 0 && (
                <p className="text-sm text-destructive">
                  Keine Lehrer verfügbar. Markiere zuerst einen Nutzer als Lehrer.
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={!selectedTeacherId || saving}
                  className="bg-accent hover:bg-accent/90"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Zuweisen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
