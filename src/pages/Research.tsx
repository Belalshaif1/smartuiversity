import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, User } from 'lucide-react';

const Research: React.FC = () => {
  const { t, language } = useLanguage();
  const [research, setResearch] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('research').select('*, departments(name_ar, name_en)')
      .eq('published', true).order('created_at', { ascending: false })
      .then(({ data }) => setResearch(data || []));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-3xl font-bold text-foreground">{t('research.title')}</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {research.map(r => (
          <Card key={r.id} className="transition-all hover:shadow-lg hover:border-gold">
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-gold shrink-0" />
                <CardTitle className="text-lg">{language === 'ar' ? r.title_ar : (r.title_en || r.title_ar)}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{language === 'ar' ? r.abstract_ar : (r.abstract_en || r.abstract_ar)}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{r.author_name}</span>
                </div>
                {r.pdf_url && (
                  <a href={r.pdf_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm"><Download className="h-3 w-3 me-1" />{t('research.download')}</Button>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {research.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">{t('research.no_research')}</p>}
      </div>
    </div>
  );
};

export default Research;
