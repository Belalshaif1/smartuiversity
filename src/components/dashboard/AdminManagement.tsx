import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Shield, ShieldOff, KeyRound, UserCog } from 'lucide-react';

interface AdminRole {
  id: string;
  user_id: string;
  role: string;
  university_id: string | null;
  college_id: string | null;
  department_id: string | null;
  is_active: boolean;
  profiles?: { full_name: string | null } | null;
}

interface Props {
  universities: any[];
  colleges: any[];
  departments: any[];
}

const AdminManagement: React.FC<Props> = ({ universities, colleges, departments }) => {
  const { language } = useLanguage();
  const { user, userRole, session } = useAuth();
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordDialog, setPasswordDialog] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', role: '',
    university_id: '', college_id: '', department_id: '',
  });

  const isAr = language === 'ar';
  const role = userRole?.role;

  const fetchAdmins = async () => {
    // Fetch roles with profile join using user_id
    const { data } = await supabase
      .from('user_roles')
      .select('id, user_id, role, university_id, college_id, department_id, is_active')
      .neq('user_id', user!.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      // Fetch profiles for these users
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const enriched = data.map(d => ({
        ...d,
        profiles: profileMap.get(d.user_id) || null,
      }));
      setAdmins(enriched as AdminRole[]);
    }
  };

  useEffect(() => {
    if (user && userRole) fetchAdmins();
  }, [user, userRole]);

  const callEdgeFunction = async (body: any) => {
    const response = await supabase.functions.invoke('manage-admin', {
      body,
    });
    if (response.error) throw new Error(response.error.message);
    if (response.data?.error) throw new Error(response.data.error);
    return response.data;
  };

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.role) {
      toast({ title: isAr ? 'أكمل جميع الحقول المطلوبة' : 'Fill all required fields', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await callEdgeFunction({
        action: 'create',
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: form.role,
        university_id: form.university_id || null,
        college_id: form.college_id || null,
        department_id: form.department_id || null,
      });
      toast({ title: isAr ? 'تم إنشاء المدير بنجاح' : 'Admin created successfully' });
      setDialogOpen(false);
      setForm({ email: '', password: '', full_name: '', role: '', university_id: '', college_id: '', department_id: '' });
      fetchAdmins();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleToggle = async (roleId: string, isActive: boolean) => {
    try {
      await callEdgeFunction({ action: 'toggle_active', role_id: roleId, is_active: !isActive });
      toast({ title: isAr ? (isActive ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب') : (isActive ? 'Account deactivated' : 'Account activated') });
      fetchAdmins();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    try {
      await callEdgeFunction({ action: 'update_password', role_id: passwordDialog, new_password: newPassword });
      toast({ title: isAr ? 'تم تغيير كلمة المرور' : 'Password changed' });
      setPasswordDialog(null);
      setNewPassword('');
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
  };

  const getRoleName = (r: string) => {
    const names: Record<string, Record<string, string>> = {
      super_admin: { ar: 'مدير الموقع', en: 'Super Admin' },
      university_admin: { ar: 'مدير جامعة', en: 'University Admin' },
      college_admin: { ar: 'مدير كلية', en: 'College Admin' },
      department_admin: { ar: 'مدير قسم', en: 'Department Admin' },
    };
    return names[r]?.[language] || r;
  };

  const getEntityName = (admin: AdminRole) => {
    if (admin.university_id) {
      const uni = universities.find(u => u.id === admin.university_id);
      if (uni) return isAr ? uni.name_ar : (uni.name_en || uni.name_ar);
    }
    if (admin.college_id) {
      const col = colleges.find(c => c.id === admin.college_id);
      if (col) return isAr ? col.name_ar : (col.name_en || col.name_ar);
    }
    if (admin.department_id) {
      const dep = departments.find(d => d.id === admin.department_id);
      if (dep) return isAr ? dep.name_ar : (dep.name_en || dep.name_ar);
    }
    return '';
  };

  // Available roles based on caller
  const availableRoles = () => {
    if (role === 'super_admin') return ['university_admin', 'college_admin', 'department_admin'];
    if (role === 'university_admin') return ['college_admin', 'department_admin'];
    if (role === 'college_admin') return ['department_admin'];
    return [];
  };

  // Filter entities based on selected role
  const filteredColleges = form.university_id
    ? colleges.filter(c => c.university_id === form.university_id)
    : colleges;

  const filteredDepartments = form.college_id
    ? departments.filter(d => d.college_id === form.college_id)
    : departments;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UserCog className="h-5 w-5 text-gold" />
          {isAr ? 'إدارة المدراء' : 'Manage Admins'}
        </h2>
        <Button onClick={() => setDialogOpen(true)} className="bg-gold text-gold-foreground">
          <Plus className="h-4 w-4 me-1" />
          {isAr ? 'إضافة مدير' : 'Add Admin'}
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {admins.map(admin => (
          <Card key={admin.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold">{admin.profiles?.full_name || (isAr ? 'بدون اسم' : 'No name')}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={admin.is_active ? 'default' : 'destructive'} className="text-xs">
                      {getRoleName(admin.role)}
                    </Badge>
                    <Badge variant={admin.is_active ? 'outline' : 'destructive'} className="text-xs">
                      {admin.is_active ? (isAr ? 'مفعّل' : 'Active') : (isAr ? 'موقوف' : 'Inactive')}
                    </Badge>
                  </div>
                  {getEntityName(admin) && (
                    <span className="text-xs text-muted-foreground block mt-1">{getEntityName(admin)}</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggle(admin.id, admin.is_active)}
                    title={admin.is_active ? (isAr ? 'إيقاف' : 'Deactivate') : (isAr ? 'تفعيل' : 'Activate')}
                  >
                    {admin.is_active ? <ShieldOff className="h-4 w-4 text-destructive" /> : <Shield className="h-4 w-4 text-green-600" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setPasswordDialog(admin.id); setNewPassword(''); }}
                    title={isAr ? 'تغيير كلمة المرور' : 'Change Password'}
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {admins.length === 0 && (
          <p className="text-muted-foreground col-span-2 text-center py-8">
            {isAr ? 'لا يوجد مدراء' : 'No admins found'}
          </p>
        )}
      </div>

      {/* Create Admin Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAr ? 'إضافة مدير جديد' : 'Add New Admin'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{isAr ? 'الاسم الكامل' : 'Full Name'}</Label>
              <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{isAr ? 'البريد الإلكتروني' : 'Email'} *</Label>
              <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{isAr ? 'كلمة المرور' : 'Password'} *</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>{isAr ? 'الدور' : 'Role'} *</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v, university_id: '', college_id: '', department_id: '' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {availableRoles().map(r => (
                    <SelectItem key={r} value={r}>{getRoleName(r)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(form.role === 'university_admin' || form.role === 'college_admin' || form.role === 'department_admin') && role === 'super_admin' && (
              <div className="space-y-1">
                <Label>{isAr ? 'الجامعة' : 'University'}</Label>
                <Select value={form.university_id} onValueChange={v => setForm({ ...form, university_id: v, college_id: '', department_id: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {universities.map(u => (
                      <SelectItem key={u.id} value={u.id}>{isAr ? u.name_ar : (u.name_en || u.name_ar)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(form.role === 'college_admin' || form.role === 'department_admin') && (
              <div className="space-y-1">
                <Label>{isAr ? 'الكلية' : 'College'}</Label>
                <Select value={form.college_id} onValueChange={v => setForm({ ...form, college_id: v, department_id: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {filteredColleges.map(c => (
                      <SelectItem key={c.id} value={c.id}>{isAr ? c.name_ar : (c.name_en || c.name_ar)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.role === 'department_admin' && (
              <div className="space-y-1">
                <Label>{isAr ? 'القسم' : 'Department'}</Label>
                <Select value={form.department_id} onValueChange={v => setForm({ ...form, department_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {filteredDepartments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{isAr ? d.name_ar : (d.name_en || d.name_ar)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleCreate} disabled={loading} className="bg-gold text-gold-foreground">
                {loading ? (isAr ? 'جاري الإنشاء...' : 'Creating...') : (isAr ? 'إنشاء' : 'Create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordDialog} onOpenChange={() => setPasswordDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setPasswordDialog(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleChangePassword} className="bg-gold text-gold-foreground">{isAr ? 'تغيير' : 'Change'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagement;
