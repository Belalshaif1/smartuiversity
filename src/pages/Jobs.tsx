import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Calendar } from 'lucide-react';

const Jobs: React.FC = () => {
  const { t, language } = useLanguage();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('jobs').select('*, colleges(name_ar, name_en)').eq('is_active', true).order('created_at', { ascending: false })
      .then(({ data }) => setJobs(data || []));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-3xl font-bold text-foreground">{t('jobs.title')}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {jobs.map(j => (
          <Card key={j.id} className="transition-all hover:shadow-lg hover:border-gold">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-6 w-6 text-gold shrink-0" />
                  <CardTitle className="text-lg">{language === 'ar' ? j.title_ar : (j.title_en || j.title_ar)}</CardTitle>
                </div>
                {j.colleges && <Badge variant="secondary">{language === 'ar' ? j.colleges.name_ar : (j.colleges.name_en || j.colleges.name_ar)}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{language === 'ar' ? j.description_ar : (j.description_en || j.description_ar)}</p>
              {j.deadline && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{t('jobs.deadline')}: {new Date(j.deadline).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {jobs.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">{t('jobs.no_jobs')}</p>}
      </div>
    </div>
  );
};

export default Jobs;
