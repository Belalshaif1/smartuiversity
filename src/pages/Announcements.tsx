import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone } from 'lucide-react';

const Announcements: React.FC = () => {
  const { t, language } = useLanguage();
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('announcements').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setAnnouncements(data || []));
  }, []);

  const scopeLabel = (scope: string) => {
    if (scope === 'global') return language === 'ar' ? 'عام' : 'Global';
    if (scope === 'university') return language === 'ar' ? 'جامعة' : 'University';
    return language === 'ar' ? 'كلية' : 'College';
  };

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-3xl font-bold text-foreground flex items-center gap-3">
        <Megaphone className="h-8 w-8 text-gold" />
        {t('announcements.title')}
      </h1>
      <div className="grid gap-4">
        {announcements.map(a => (
          <Card key={a.id} className="transition-all hover:shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-foreground">{language === 'ar' ? a.title_ar : (a.title_en || a.title_ar)}</h3>
                <Badge variant="outline" className="border-gold text-gold shrink-0 ms-2">{scopeLabel(a.scope)}</Badge>
              </div>
              <p className="text-muted-foreground mb-2">{language === 'ar' ? a.content_ar : (a.content_en || a.content_ar)}</p>
              <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}</span>
            </CardContent>
          </Card>
        ))}
        {announcements.length === 0 && <p className="text-center text-muted-foreground py-12">{t('announcements.no_announcements')}</p>}
      </div>
    </div>
  );
};

export default Announcements;
