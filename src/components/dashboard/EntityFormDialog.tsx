import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeForm: string;
  formData: any;
  setFormData: (data: any) => void;
  editId: string | null;
  universities: any[];
  colleges: any[];
  departments: any[];
  onSuccess: () => void;
}

const EntityFormDialog: React.FC<Props> = ({
  open, onOpenChange, activeForm, formData, setFormData,
  editId, universities, colleges, departments, onSuccess,
}) => {
  const { t, language } = useLanguage();
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const role = userRole?.role;

  const f = (key: string, label: string, type = 'text', required = false) => (
    <div className="space-y-1" key={key}>
      <Label>{label}{required && ' *'}</Label>
      {type === 'textarea' ? (
        <Textarea value={formData[key] || ''} onChange={e => setFormData({ ...formData, [key]: e.target.value })} required={required} />
      ) : (
        <Input type={type} value={formData[key] || ''} onChange={e => setFormData({ ...formData, [key]: e.target.value })} required={required} />
      )}
    </div>
  );

  const selectField = (key: string, label: string, options: any[]) => (
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

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      let result: { error: any } = { error: null };
      const currentRole = userRole?.role;

      if (activeForm === 'university') {
        const payload = { name_ar: formData.name_ar, name_en: formData.name_en, description_ar: formData.description_ar, description_en: formData.description_en };
        result = editId ? await supabase.from('universities').update(payload).eq('id', editId) : await supabase.from('universities').insert(payload);
      } else if (activeForm === 'college') {
        const universityId = currentRole === 'university_admin' ? userRole!.university_id : formData.university_id;
        if (!universityId) { toast({ title: language === 'ar' ? 'يرجى اختيار الجامعة' : 'Please select a university', variant: 'destructive' }); setSaving(false); return; }
        const payload = { name_ar: formData.name_ar, name_en: formData.name_en, description_ar: formData.description_ar, description_en: formData.description_en, university_id: universityId };
        result = editId ? await supabase.from('colleges').update(payload).eq('id', editId) : await supabase.from('colleges').insert(payload);
      } else if (activeForm === 'department') {
        const collegeId = currentRole === 'college_admin' ? userRole!.college_id : formData.college_id;
        if (!collegeId) { toast({ title: language === 'ar' ? 'يرجى اختيار الكلية' : 'Please select a college', variant: 'destructive' }); setSaving(false); return; }
        const payload = { name_ar: formData.name_ar, name_en: formData.name_en, description_ar: formData.description_ar, description_en: formData.description_en, college_id: collegeId };
        result = editId ? await supabase.from('departments').update(payload).eq('id', editId) : await supabase.from('departments').insert(payload);
      } else if (activeForm === 'announcement') {
        const payload = { title_ar: formData.title_ar, title_en: formData.title_en, content_ar: formData.content_ar, content_en: formData.content_en, scope: formData.scope || 'global', university_id: formData.university_id || null, college_id: formData.college_id || null, created_by: user!.id };
        result = editId ? await supabase.from('announcements').update(payload).eq('id', editId) : await supabase.from('announcements').insert(payload);
      } else if (activeForm === 'graduate') {
        if (!formData.department_id) { toast({ title: language === 'ar' ? 'يرجى اختيار القسم' : 'Please select a department', variant: 'destructive' }); setSaving(false); return; }
        const payload = { full_name_ar: formData.full_name_ar, full_name_en: formData.full_name_en, department_id: formData.department_id, graduation_year: parseInt(formData.graduation_year), gpa: formData.gpa ? parseFloat(formData.gpa) : null, specialization_ar: formData.specialization_ar, specialization_en: formData.specialization_en };
        result = editId ? await supabase.from('graduates').update(payload).eq('id', editId) : await supabase.from('graduates').insert(payload);
      } else if (activeForm === 'research') {
        if (!formData.department_id) { toast({ title: language === 'ar' ? 'يرجى اختيار القسم' : 'Please select a department', variant: 'destructive' }); setSaving(false); return; }
        const payload = { title_ar: formData.title_ar, title_en: formData.title_en, abstract_ar: formData.abstract_ar, abstract_en: formData.abstract_en, author_name: formData.author_name, department_id: formData.department_id, published: formData.published !== false };
        result = editId ? await supabase.from('research').update(payload).eq('id', editId) : await supabase.from('research').insert(payload);
      } else if (activeForm === 'job') {
        if (!formData.college_id) { toast({ title: language === 'ar' ? 'يرجى اختيار الكلية' : 'Please select a college', variant: 'destructive' }); setSaving(false); return; }
        const payload = { title_ar: formData.title_ar, title_en: formData.title_en, description_ar: formData.description_ar, description_en: formData.description_en, college_id: formData.college_id, deadline: formData.deadline || null };
        result = editId ? await supabase.from('jobs').update(payload).eq('id', editId) : await supabase.from('jobs').insert(payload);
      } else if (activeForm === 'fee') {
        if (!formData.department_id) { toast({ title: language === 'ar' ? 'يرجى اختيار القسم' : 'Please select a department', variant: 'destructive' }); setSaving(false); return; }
        const payload = { department_id: formData.department_id, fee_type: formData.fee_type || 'public', amount: parseFloat(formData.amount), academic_year: formData.academic_year };
        result = editId ? await supabase.from('fees').update(payload).eq('id', editId) : await supabase.from('fees').insert(payload);
      }

      if (result.error) {
        toast({ title: result.error.message, variant: 'destructive' });
        setSaving(false);
        return;
      }

      toast({ title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully' });
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast({ title: err.message || 'An error occurred', variant: 'destructive' });
    }
    setSaving(false);
  }, [activeForm, formData, editId, userRole, user, language, toast, onOpenChange, onSuccess]);

  const renderForm = () => {
    switch (activeForm) {
      case 'university':
        return <>{f('name_ar', t('common.name_ar'), 'text', true)}{f('name_en', t('common.name_en'))}{f('description_ar', t('common.description_ar'), 'textarea')}{f('description_en', t('common.description_en'), 'textarea')}</>;
      case 'college':
        return <>{role === 'super_admin' && selectField('university_id', t('nav.universities'), universities)}{f('name_ar', t('common.name_ar'), 'text', true)}{f('name_en', t('common.name_en'))}{f('description_ar', t('common.description_ar'), 'textarea')}</>;
      case 'department':
        return <>{role === 'super_admin' && selectField('college_id', t('nav.universities') + ' > ' + t('universities.colleges'), colleges)}{role === 'university_admin' && selectField('college_id', t('universities.colleges'), colleges)}{f('name_ar', t('common.name_ar'), 'text', true)}{f('name_en', t('common.name_en'))}{f('description_ar', t('common.description_ar'), 'textarea')}</>;
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

  const formTitles: Record<string, string> = {
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editId ? t('common.edit') : t('common.add')} - {formTitles[activeForm] || ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {renderForm()}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-gold text-gold-foreground">
              {saving ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : t('common.save')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EntityFormDialog;
