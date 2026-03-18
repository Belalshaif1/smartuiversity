import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, BookOpen, FileText, GraduationCap, BarChart3,
  Megaphone, Briefcase, Users, DollarSign, UserCog, Shield,
} from 'lucide-react';
import { useDashboardData } from '@/hooks/useDashboardData';
import DashboardStats from '@/components/dashboard/DashboardStats';
import EntityList from '@/components/dashboard/EntityList';
import EntityFormDialog from '@/components/dashboard/EntityFormDialog';
import AdminManagement from '@/components/dashboard/AdminManagement';
import UserManagementTable from '@/components/dashboard/UserManagementTable';
import RolePermissions from '@/components/dashboard/RolePermissions';

const Dashboard: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { universities, colleges, departments, stats, isLoading, refresh } = useDashboardData();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeForm, setActiveForm] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [editId, setEditId] = useState<string | null>(null);

  const role = userRole?.role;

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && (!user || !userRole)) navigate('/login');
  }, [user, userRole, authLoading, navigate]);

  const openAdd = useCallback((type: string) => {
    setActiveForm(type);
    setFormData({});
    setEditId(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((type: string, item: any) => {
    setActiveForm(type);
    setFormData(item);
    setEditId(item.id);
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (table: string, id: string) => {
    if (!window.confirm(t('common.confirm_delete'))) return;
    const { error } = await (supabase.from(table as any) as any).delete().eq('id', id);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: language === 'ar' ? 'تم الحذف' : 'Deleted' });
    refresh();
  }, [t, language, toast, refresh]);

  const getName = useCallback((item: any) => language === 'ar' ? item.name_ar : (item.name_en || item.name_ar), [language]);

  if (authLoading || isLoading) return <div className="flex items-center justify-center py-20 text-muted-foreground">{t('common.loading')}</div>;
  if (!user || !userRole) return null;

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-2 text-3xl font-bold text-foreground flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-gold" />
        {t('dashboard.title')}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {language === 'ar'
          ? `الدور: ${role === 'super_admin' ? 'مدير الموقع' : role === 'university_admin' ? 'مدير جامعة' : role === 'college_admin' ? 'مدير كلية' : 'مدير قسم'}`
          : `Role: ${role?.replace('_', ' ')}`}
      </p>

      <DashboardStats stats={stats} role={role!} />

      <Tabs defaultValue={role === 'super_admin' ? 'users' : 'admins'}>
        <TabsList className="flex flex-wrap gap-1 h-auto mb-6">
          {role === 'super_admin' && <TabsTrigger value="users"><Users className="h-4 w-4 me-1" />{language === 'ar' ? 'إدارة المستخدمين' : 'User Management'}</TabsTrigger>}
          {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && <TabsTrigger value="admins"><UserCog className="h-4 w-4 me-1" />{t('dashboard.manage_admins')}</TabsTrigger>}
          {role === 'super_admin' && <TabsTrigger value="permissions"><Shield className="h-4 w-4 me-1" />{language === 'ar' ? 'الأدوار والصلاحيات' : 'Roles & Permissions'}</TabsTrigger>}
          {role === 'super_admin' && <TabsTrigger value="universities"><Building2 className="h-4 w-4 me-1" />{t('nav.universities')}</TabsTrigger>}
          {(role === 'super_admin' || role === 'university_admin') && <TabsTrigger value="colleges"><BookOpen className="h-4 w-4 me-1" />{t('universities.colleges')}</TabsTrigger>}
          {role !== 'department_admin' && <TabsTrigger value="departments"><FileText className="h-4 w-4 me-1" />{t('universities.departments')}</TabsTrigger>}
          <TabsTrigger value="announcements"><Megaphone className="h-4 w-4 me-1" />{t('nav.announcements')}</TabsTrigger>
          {(role === 'college_admin' || role === 'super_admin' || role === 'university_admin') && <TabsTrigger value="jobs"><Briefcase className="h-4 w-4 me-1" />{t('nav.jobs')}</TabsTrigger>}
          <TabsTrigger value="graduates"><GraduationCap className="h-4 w-4 me-1" />{t('nav.graduates')}</TabsTrigger>
          <TabsTrigger value="research"><FileText className="h-4 w-4 me-1" />{t('nav.research')}</TabsTrigger>
          {(role === 'super_admin' || role === 'university_admin') && <TabsTrigger value="fees"><DollarSign className="h-4 w-4 me-1" />{t('nav.fees')}</TabsTrigger>}
        </TabsList>

        {role === 'super_admin' && (
          <TabsContent value="users">
            <UserManagementTable onAddAdmin={() => {
              const adminsTab = document.querySelector('[data-value="admins"]') as HTMLElement;
              adminsTab?.click();
            }} />
          </TabsContent>
        )}

        {(role === 'super_admin' || role === 'university_admin' || role === 'college_admin') && (
          <TabsContent value="admins">
            <AdminManagement universities={universities} colleges={colleges} departments={departments} />
          </TabsContent>
        )}

        {role === 'super_admin' && (
          <TabsContent value="permissions"><RolePermissions /></TabsContent>
        )}

        {role === 'super_admin' && (
          <TabsContent value="universities">
            <EntityList
              title={t('dashboard.manage_universities')}
              items={universities}
              entityType="university"
              onAdd={() => openAdd('university')}
              onEdit={(item) => openEdit('university', item)}
              onDelete={(id) => handleDelete('universities', id)}
            />
          </TabsContent>
        )}

        {(role === 'super_admin' || role === 'university_admin') && (
          <TabsContent value="colleges">
            <EntityList
              title={t('dashboard.manage_colleges')}
              items={colleges}
              entityType="college"
              onAdd={() => openAdd('college')}
              onEdit={(item) => openEdit('college', item)}
              onDelete={(id) => handleDelete('colleges', id)}
              getSubtitle={(c) => c.universities ? getName(c.universities) : null}
            />
          </TabsContent>
        )}

        <TabsContent value="departments">
          <EntityList
            title={t('dashboard.manage_departments')}
            items={departments}
            entityType="department"
            showAdd={role !== 'department_admin'}
            showDelete={role !== 'department_admin'}
            onAdd={() => openAdd('department')}
            onEdit={(item) => openEdit('department', item)}
            onDelete={(id) => handleDelete('departments', id)}
            getSubtitle={(d) => d.colleges ? getName(d.colleges) : null}
          />
        </TabsContent>

        <TabsContent value="announcements">
          <EntityList
            title={t('dashboard.manage_announcements')}
            items={[]}
            entityType="announcement"
            onAdd={() => openAdd('announcement')}
            onEdit={(item) => openEdit('announcement', item)}
            onDelete={(id) => handleDelete('announcements', id)}
          />
        </TabsContent>

        {(role === 'college_admin' || role === 'super_admin' || role === 'university_admin') && (
          <TabsContent value="jobs">
            <EntityList
              title={t('dashboard.manage_jobs')}
              items={[]}
              entityType="job"
              onAdd={() => openAdd('job')}
              onEdit={(item) => openEdit('job', item)}
              onDelete={(id) => handleDelete('jobs', id)}
            />
          </TabsContent>
        )}

        <TabsContent value="graduates">
          <EntityList
            title={t('dashboard.manage_graduates')}
            items={[]}
            entityType="graduate"
            onAdd={() => openAdd('graduate')}
            onEdit={(item) => openEdit('graduate', item)}
            onDelete={(id) => handleDelete('graduates', id)}
          />
        </TabsContent>

        <TabsContent value="research">
          <EntityList
            title={t('dashboard.manage_research')}
            items={[]}
            entityType="research"
            onAdd={() => openAdd('research')}
            onEdit={(item) => openEdit('research', item)}
            onDelete={(id) => handleDelete('research', id)}
          />
        </TabsContent>

        {(role === 'super_admin' || role === 'university_admin') && (
          <TabsContent value="fees">
            <EntityList
              title={t('dashboard.manage_fees')}
              items={[]}
              entityType="fee"
              onAdd={() => openAdd('fee')}
              onEdit={(item) => openEdit('fee', item)}
              onDelete={(id) => handleDelete('fees', id)}
            />
          </TabsContent>
        )}
      </Tabs>

      <EntityFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        activeForm={activeForm}
        formData={formData}
        setFormData={setFormData}
        editId={editId}
        universities={universities}
        colleges={colleges}
        departments={departments}
        onSuccess={refresh}
      />
    </div>
  );
};

export default Dashboard;
