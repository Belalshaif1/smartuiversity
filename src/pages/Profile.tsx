import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Profile: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, profile, refreshProfile, userRole } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('user_id', user.id);
    setLoading(false);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: language === 'ar' ? 'تم الحفظ بنجاح' : 'Saved successfully' });
      refreshProfile();
    }
  };

  const roleLabel = userRole ? (
    language === 'ar' 
      ? { super_admin: 'مدير الموقع', university_admin: 'مدير جامعة', college_admin: 'مدير كلية', department_admin: 'مدير قسم' }[userRole.role]
      : userRole.role.replace('_', ' ')
  ) : (language === 'ar' ? 'مستخدم' : 'User');

  return (
    <div className="container mx-auto max-w-lg px-4 py-8 animate-fade-in">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
            <User className="h-10 w-10 text-gold" />
          </div>
          <CardTitle>{t('nav.profile')}</CardTitle>
          <p className="text-sm text-gold font-semibold">{roleLabel}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('auth.email')}</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>{t('auth.full_name')}</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{language === 'ar' ? 'الهاتف' : 'Phone'}</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <Button onClick={handleSave} className="w-full bg-gold text-gold-foreground" disabled={loading}>
            {loading ? t('common.loading') : t('common.save')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
