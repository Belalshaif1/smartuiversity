import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GraduationCap } from 'lucide-react';

const Graduates: React.FC = () => {
  const { t, language } = useLanguage();
  const [graduates, setGraduates] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('graduates').select('*, departments(name_ar, name_en)')
      .order('graduation_year', { ascending: false })
      .then(({ data }) => setGraduates(data || []));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-3xl font-bold text-foreground flex items-center gap-3">
        <GraduationCap className="h-8 w-8 text-gold" />
        {t('graduates.title')}
      </h1>
      {graduates.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'ar' ? 'الاسم' : 'Name'}</TableHead>
                  <TableHead>{t('fees.department')}</TableHead>
                  <TableHead>{t('graduates.year')}</TableHead>
                  <TableHead>{t('graduates.gpa')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {graduates.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium">{language === 'ar' ? g.full_name_ar : (g.full_name_en || g.full_name_ar)}</TableCell>
                    <TableCell>{g.departments ? (language === 'ar' ? g.departments.name_ar : g.departments.name_en) : '-'}</TableCell>
                    <TableCell>{g.graduation_year}</TableCell>
                    <TableCell>{g.gpa || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-muted-foreground py-12">{t('graduates.no_graduates')}</p>
      )}
    </div>
  );
};

export default Graduates;
