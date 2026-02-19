import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, BookOpen, FileText, GraduationCap, BarChart3, 
  Plus, Trash2, Edit, Megaphone, Briefcase, Users, DollarSign, UserCog 
} from 'lucide-react';
import AdminManagement from '@/components/dashboard/AdminManagement';

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({ universities: 0, colleges: 0, departments: 0, graduates: 0, research: 0, users: 0 });
  const [universities, setUniversities] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeForm, setActiveForm] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || !userRole)) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, userRole, authLoading]);

  const fetchData = async () => {
    if (!user || !userRole) return;
    const role = userRole.role;

    // Fetch user count (profiles count)
    const usersCount = supabase.from('profiles').select('id', { count: 'exact', head: true });

    if (role === 'super_admin') {
      const [u, c, d, g, r, usersRes] = await Promise.all([
        supabase.from('universities').select('*'),
        supabase.from('colleges').select('*, universities(name_ar, name_en)'),
        supabase.from('departments').select('*, colleges(name_ar, name_en)'),
        supabase.from('graduates').select('id', { count: 'exact', head: true }),
        supabase.from('research').select('id', { count: 'exact', head: true }),
        usersCount,
      ]);
      setUniversities(u.data || []);
      setColleges(c.data || []);
      setDepartments(d.data || []);
      setStats({ universities: (u.data || []).length, colleges: (c.data || []).length, departments: (d.data || []).length, graduates: g.count || 0, research: r.count || 0, users: usersRes.count || 0 });
    } else if (role === 'university_admin') {
      const uid = userRole.university_id;
      const [c, d, g, r, usersRes] = await Promise.all([
        supabase.from('colleges').select('*').eq('university_id', uid),
        supabase.from('departments').select('*, colleges(name_ar, name_en)').eq('colleges.university_id', uid),
        supabase.from('graduates').select('id', { count: 'exact', head: true }),
        supabase.from('research').select('id', { count: 'exact', head: true }),
        usersCount,
      ]);
      setColleges(c.data || []);
      setDepartments(d.data || []);
      setStats({ universities: 1, colleges: (c.data || []).length, departments: (d.data || []).length, graduates: g.count || 0, research: r.count || 0, users: usersRes.count || 0 });
    } else if (role === 'college_admin') {
      const [d, g, r, usersRes] = await Promise.all([
        supabase.from('departments').select('*').eq('college_id', userRole.college_id),
        supabase.from('graduates').select('id', { count: 'exact', head: true }),
        supabase.from('research').select('id', { count: 'exact', head: true }),
        usersCount,
      ]);
      setDepartments(d.data || []);
      setStats({ universities: 0, colleges: 1, departments: (d.data || []).length, graduates: g.count || 0, research: r.count || 0, users: usersRes.count || 0 });
    }
  };

  const getName = (item: any) => language === 'ar' ? item.name_ar : (item.name_en || item.name_ar);

  const openAdd = (type: string) => {
    setActiveForm(type);
    setFormData({});
    setEditId(null);
    setDialogOpen(true);
  };

  const openEdit = (type: string, item: any) => {
    setActiveForm(type);
    setFormData(item);
    setEditId(item.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (activeForm === 'university') {
        const payload = { name_ar: formData.name_ar, name_en: formData.name_en, description_ar: formData.description_ar, description_en: formData.description_en };
        if (editId) {
          await supabase.from('universities').update(payload).eq('id', editId);
        } else {
          await supabase.from('universities').insert(payload);
        }
      } else if (activeForm === 'college') {
        const payload = { name_ar: formData.name_ar, name_en: formData.name_en, description_ar: formData.description_ar, description_en: formData.description_en, university_id: formData.university_id };
        if (editId) {
          await supabase.from('colleges').update(payload).eq('id', editId);
        } else {
          await supabase.from('colleges').insert(payload);
        }
      } else if (activeForm === 'department') {
        const payload = { name_ar: formData.name_ar, name_en: formData.name_en, description_ar: formData.description_ar, description_en: formData.description_en, college_id: formData.college_id };
        if (editId) {
          await supabase.from('departments').update(payload).eq('id', editId);
        } else {
          await supabase.from('departments').insert(payload);
        }
      } else if (activeForm === 'announcement') {
        const payload = { title_ar: formData.title_ar, title_en: formData.title_en, content_ar: formData.content_ar, content_en: formData.content_en, scope: formData.scope || 'global', university_id: formData.university_id || null, college_id: formData.college_id || null, created_by: user!.id };
        if (editId) {
          await supabase.from('announcements').update(payload).eq('id', editId);
        } else {
          await supabase.from('announcements').insert(payload);
        }
      } else if (activeForm === 'graduate') {
        const payload = { full_name_ar: formData.full_name_ar, full_name_en: formData.full_name_en, department_id: formData.department_id, graduation_year: parseInt(formData.graduation_year), gpa: formData.gpa ? parseFloat(formData.gpa) : null, specialization_ar: formData.specialization_ar, specialization_en: formData.specialization_en };
        if (editId) {
          await supabase.from('graduates').update(payload).eq('id', editId);
        } else {
          await supabase.from('graduates').insert(payload);
        }
      } else if (activeForm === 'research') {
        const payload = { title_ar: formData.title_ar, title_en: formData.title_en, abstract_ar: formData.abstract_ar, abstract_en: formData.abstract_en, author_name: formData.author_name, department_id: formData.department_id, published: formData.published !== false };
        if (editId) {
          await supabase.from('research').update(payload).eq('id', editId);
        } else {
          await supabase.from('research').insert(payload);
        }
      } else if (activeForm === 'job') {
        const payload = { title_ar: formData.title_ar, title_en: formData.title_en, description_ar: formData.description_ar, description_en: formData.description_en, college_id: formData.college_id, deadline: formData.deadline || null };
        if (editId) {
          await supabase.from('jobs').update(payload).eq('id', editId);
        } else {
          await supabase.from('jobs').insert(payload);
        }
      } else if (activeForm === 'fee') {
        const payload = { department_id: formData.department_id, fee_type: formData.fee_type || 'public', amount: parseFloat(formData.amount), academic_year: formData.academic_year };
        if (editId) {
          await supabase.from('fees').update(payload).eq('id', editId);
        } else {
          await supabase.from('fees').insert(payload);
        }
      }
      toast({ title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully' });
      setDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (table: 'universities' | 'colleges' | 'departments' | 'announcements' | 'graduates' | 'research' | 'jobs' | 'fees', id: string) => {
    if (!confirm(t('common.confirm_delete'))) return;
    await (supabase.from(table) as any).delete().eq('id', id);
    toast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted' });
    fetchData();
  };

  const role = userRole?.role;
  if (authLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">{t('common.loading')}</div>;
  if (!user || !userRole) return null;

  const statCards = [
    { key: 'users', icon: Users, label: language === 'ar' ? 'المستخدمين' : 'Users', show: role === 'super_admin' || role === 'university_admin' || role === 'college_admin' },
    { key: 'universities', icon: Building2, label: t('home.stats.universities'), show: role === 'super_admin' },
    { key: 'colleges', icon: BookOpen, label: t('home.stats.colleges'), show: role !== 'department_admin' },
    { key: 'departments', icon: FileText, label: t('home.stats.departments'), show: true },
    { key: 'graduates', icon: GraduationCap, label: t('home.stats.graduates'), show: true },
    { key: 'research', icon: FileText, label: t('home.stats.research'), show: true },
  ].filter(s => s.show);

  const renderForm = () => {
    const f = (key: string, label: string, type = 'text', required = false) => (
      <div className="space-y-1" key={key}>
        <Label>{label}</Label>
        {type === 'textarea' ? (
          <Textarea value={formData[key] || ''} onChange={e => setFormData({ ...formData, [key]: e.target.value })} required={required} />
        ) : (
          <Input type={type} value={formData[key] || ''} onChange={e => setFormData({ ...formData, [key]: e.target.value })} required={required} />
        )}
      </div>
    );

    const selectField = (key: string, label: string, options: any[], nameField = 'name_ar') => (
      <div className="space-y-1" key={key}>
        <Label>{label}</Label>
        <Select value={formData[key] || ''} onValueChange={v => setFormData({ ...formData, [key]: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o.id} value={o.id}>{language === 'ar' ? o.name_ar : (o.name_en || o.name_ar)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    );

    switch (activeForm) {
      case 'university':
        return <>{f('name_ar', t('common.name_ar'), 'text', true)}{f('name_en', t('common.name_en'))}{f('description_ar', t('common.description_ar'), 'textarea')}{f('description_en', t('common.description_en'), 'textarea')}</>;
      case 'college':
        return <>{selectField('university_id', t('nav.universities'), universities)}{f('name_ar', t('common.name_ar'), 'text', true)}{f('name_en', t('common.name_en'))}{f('description_ar', t('common.description_ar'), 'textarea')}</>;
      case 'department':
        return <>{selectField('college_id', t('nav.universities') + ' > ' + t('universities.colleges'), colleges)}{f('name_ar', t('common.name_ar'), 'text', true)}{f('name_en', t('common.name_en'))}{f('description_ar', t('common.description_ar'), 'textarea')}</>;
      case 'announcement':
        return <>{f('title_ar', t('common.name_ar'), 'text', true)}{f('title_en', t('common.name_en'))}{f('content_ar', t('common.description_ar'), 'textarea', true)}{f('content_en', t('common.description_en'), 'textarea')}</>;
      case 'graduate':
        return <>{selectField('department_id', t('universities.departments'), departments)}{f('full_name_ar', t('common.name_ar'), 'text', true)}{f('full_name_en', t('common.name_en'))}{f('graduation_year', t('graduates.year'), 'number', true)}{f('gpa', t('graduates.gpa'), 'number')}</>;
      case 'research':
        return <>{selectField('department_id', t('universities.departments'), departments)}{f('title_ar', t('common.name_ar'), 'text', true)}{f('title_en', t('common.name_en'))}{f('author_name', t('research.author'), 'text', true)}{f('abstract_ar', t('common.description_ar'), 'textarea')}</>;
      case 'job':
        return <>{selectField('college_id', t('universities.colleges'), colleges)}{f('title_ar', t('common.name_ar'), 'text', true)}{f('title_en', t('common.name_en'))}{f('description_ar', t('common.description_ar'), 'textarea', true)}{f('deadline', t('jobs.deadline'), 'date')}</>;
      case 'fee':
        return <>{selectField('department_id', t('universities.departments'), departments)}{f('amount', t('fees.amount'), 'number', true)}{f('academic_year', language === 'ar' ? 'السنة الدراسية' : 'Academic Year')}
          <div className="space-y-1">
            <Label>{language === 'ar' ? 'النوع' : 'Type'}</Label>
            <Select value={formData.fee_type || 'public'} onValueChange={v => setFormData({ ...formData, fee_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="public">{t('fees.public')}</SelectItem>
                <SelectItem value="private">{t('fees.private')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>;
      default: return null;
    }
  };

  const formTitle: Record<string, string> = {
    university: t('dashboard.manage_universities'),
    college: t('dashboard.manage_colleges'),
    department: t('dashboard.manage_departments'),
    announcement: t('dashboard.manage_announcements'),
    graduate: t('dashboard.manage_graduates'),
    research: t('dashboard.manage_research'),
    job: t('dashboard.manage_jobs'),
    fee: t('dashboard.manage_fees'),
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-2 text-3xl font-bold text-foreground flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-gold" />
        {t('dashboard.title')}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {language === 'ar' ? `الدور: ${role === 'super_admin' ? 'مدير الموقع' : role === 'university_admin' ? 'مدير جامعة' : role === 'college_admin' ? 'مدير كلية' : 'مدير قسم'}` : `Role: ${role?.replace('_', ' ')}`}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-3 lg:grid-cols-6">
        {statCards.map(s => (
          <Card key={s.key}>
            <CardContent className="flex flex-col items-center p-4 text-center">
              <s.icon className="mb-2 h-6 w-6 text-gold" />
              <span className="text-2xl font-bold">{stats[s.key as keyof typeof stats]}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue={role === 'super_admin' ? 'universities' : role === 'university_admin' ? 'colleges' : role === 'college_admin' ? 'departments' : 'research'}>
        <TabsList className="flex flex-wrap gap-1 h-auto mb-6">
          {role === 'super_admin' && <TabsTrigger value="universities"><Building2 className="h-4 w-4 me-1" />{t('nav.universities')}</TabsTrigger>}
          {(role === 'super_admin' || role === 'university_admin') && <TabsTrigger value="colleges"><BookOpen className="h-4 w-4 me-1" />{t('universities.colleges')}</TabsTrigger>}
          {(role !== 'department_admin') && <TabsTrigger value="departments"><FileText className="h-4 w-4 me-1" />{t('universities.departments')}</TabsTrigger>}
          <TabsTrigger value="announcements"><Megaphone className="h-4 w-4 me-1" />{t('nav.announcements')}</TabsTrigger>
          {(role === 'college_admin' || role === 'super_admin' || role === 'university_admin') && <TabsTrigger value="jobs"><Briefcase className="h-4 w-4 me-1" />{t('nav.jobs')}</TabsTrigger>}
          <TabsTrigger value="graduates"><GraduationCap className="h-4 w-4 me-1" />{t('nav.graduates')}</TabsTrigger>
          <TabsTrigger value="research"><FileText className="h-4 w-4 me-1" />{t('nav.research')}</TabsTrigger>
          {(role === 'super_admin' || role === 'university_admin') && <TabsTrigger value="fees"><DollarSign className="h-4 w-4 me-1" />{t('nav.fees')}</TabsTrigger>}
          {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && <TabsTrigger value="admins"><UserCog className="h-4 w-4 me-1" />{t('dashboard.manage_admins')}</TabsTrigger>}
        </TabsList>

        {/* Universities */}
        {role === 'super_admin' && (
          <TabsContent value="universities">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('dashboard.manage_universities')}</h2>
              <Button onClick={() => openAdd('university')} className="bg-gold text-gold-foreground"><Plus className="h-4 w-4 me-1" />{t('common.add')}</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {universities.map(u => (
                <Card key={u.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <span className="font-semibold">{getName(u)}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit('university', u)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete('universities', u.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Colleges */}
        {(role === 'super_admin' || role === 'university_admin') && (
          <TabsContent value="colleges">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{t('dashboard.manage_colleges')}</h2>
              <Button onClick={() => openAdd('college')} className="bg-gold text-gold-foreground"><Plus className="h-4 w-4 me-1" />{t('common.add')}</Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {colleges.map(c => (
                <Card key={c.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <span className="font-semibold">{getName(c)}</span>
                      {c.universities && <span className="block text-xs text-muted-foreground">{getName(c.universities)}</span>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit('college', c)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete('colleges', c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Departments */}
        <TabsContent value="departments">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('dashboard.manage_departments')}</h2>
            {role !== 'department_admin' && <Button onClick={() => openAdd('department')} className="bg-gold text-gold-foreground"><Plus className="h-4 w-4 me-1" />{t('common.add')}</Button>}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {departments.map(d => (
              <Card key={d.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <span className="font-semibold">{getName(d)}</span>
                    {d.colleges && <span className="block text-xs text-muted-foreground">{getName(d.colleges)}</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit('department', d)}><Edit className="h-4 w-4" /></Button>
                    {role !== 'department_admin' && <Button variant="ghost" size="icon" onClick={() => handleDelete('departments', d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Announcements */}
        <TabsContent value="announcements">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('dashboard.manage_announcements')}</h2>
            <Button onClick={() => openAdd('announcement')} className="bg-gold text-gold-foreground"><Plus className="h-4 w-4 me-1" />{t('common.add')}</Button>
          </div>
        </TabsContent>

        {/* Jobs */}
        <TabsContent value="jobs">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('dashboard.manage_jobs')}</h2>
            <Button onClick={() => openAdd('job')} className="bg-gold text-gold-foreground"><Plus className="h-4 w-4 me-1" />{t('common.add')}</Button>
          </div>
        </TabsContent>

        {/* Graduates */}
        <TabsContent value="graduates">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('dashboard.manage_graduates')}</h2>
            <Button onClick={() => openAdd('graduate')} className="bg-gold text-gold-foreground"><Plus className="h-4 w-4 me-1" />{t('common.add')}</Button>
          </div>
        </TabsContent>

        {/* Research */}
        <TabsContent value="research">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('dashboard.manage_research')}</h2>
            <Button onClick={() => openAdd('research')} className="bg-gold text-gold-foreground"><Plus className="h-4 w-4 me-1" />{t('common.add')}</Button>
          </div>
        </TabsContent>

        {/* Fees */}
        <TabsContent value="fees">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">{t('dashboard.manage_fees')}</h2>
            <Button onClick={() => openAdd('fee')} className="bg-gold text-gold-foreground"><Plus className="h-4 w-4 me-1" />{t('common.add')}</Button>
          </div>
        </TabsContent>

        {/* Admins */}
        {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && (
          <TabsContent value="admins">
            <AdminManagement universities={universities} colleges={colleges} departments={departments} />
          </TabsContent>
        )}
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? t('common.edit') : t('common.add')} - {formTitle[activeForm]}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {renderForm()}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
              <Button onClick={handleSave} className="bg-gold text-gold-foreground">{t('common.save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
