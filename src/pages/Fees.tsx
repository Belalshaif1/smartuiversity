import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign } from 'lucide-react';

const Fees: React.FC = () => {
  const { t, language } = useLanguage();
  const [fees, setFees] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('fees').select('*, departments(name_ar, name_en, colleges(name_ar, name_en))')
      .order('created_at', { ascending: false })
      .then(({ data }) => setFees(data || []));
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-3xl font-bold text-foreground flex items-center gap-3">
        <DollarSign className="h-8 w-8 text-gold" />
        {t('fees.title')}
      </h1>
      {fees.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('fees.college')}</TableHead>
                  <TableHead>{t('fees.department')}</TableHead>
                  <TableHead>{language === 'ar' ? 'النوع' : 'Type'}</TableHead>
                  <TableHead>{t('fees.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map(f => (
                  <TableRow key={f.id}>
                    <TableCell>{f.departments?.colleges ? (language === 'ar' ? f.departments.colleges.name_ar : f.departments.colleges.name_en) : '-'}</TableCell>
                    <TableCell>{f.departments ? (language === 'ar' ? f.departments.name_ar : f.departments.name_en) : '-'}</TableCell>
                    <TableCell>{f.fee_type === 'public' ? t('fees.public') : t('fees.private')}</TableCell>
                    <TableCell className="font-bold text-gold">{f.amount?.toLocaleString()} {f.currency}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-muted-foreground py-12">{t('fees.no_fees')}</p>
      )}
    </div>
  );
};

export default Fees;
