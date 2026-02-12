import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, ArrowRight, ArrowLeft, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Universities: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const { universityId, collegeId } = useParams();
  const [universities, setUniversities] = useState<any[]>([]);
  const [colleges, setColleges] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [currentUni, setCurrentUni] = useState<any>(null);
  const [currentCollege, setCurrentCollege] = useState<any>(null);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (collegeId) {
      supabase.from('departments').select('*').eq('college_id', collegeId).then(({ data }) => setDepartments(data || []));
      supabase.from('colleges').select('*').eq('id', collegeId).single().then(({ data }) => setCurrentCollege(data));
    } else if (universityId) {
      supabase.from('colleges').select('*').eq('university_id', universityId).then(({ data }) => setColleges(data || []));
      supabase.from('universities').select('*').eq('id', universityId).single().then(({ data }) => setCurrentUni(data));
    } else {
      supabase.from('universities').select('*').order('name_ar').then(({ data }) => setUniversities(data || []));
    }
  }, [universityId, collegeId]);

  const getName = (item: any) => language === 'ar' ? item.name_ar : (item.name_en || item.name_ar);
  const getDesc = (item: any) => language === 'ar' ? item.description_ar : (item.description_en || item.description_ar);

  const filteredUniversities = universities.filter(u => 
    getName(u).toLowerCase().includes(search.toLowerCase())
  );

  // Show departments for a college
  if (collegeId) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <Link to={`/universities/${currentCollege?.university_id}`}>
          <Button variant="ghost" className="mb-4"><ArrowRight className="h-4 w-4 rotate-180 me-2" />{t('universities.back')}</Button>
        </Link>
        <h1 className="mb-6 text-3xl font-bold text-foreground">{currentCollege && getName(currentCollege)} - {t('universities.departments')}</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map(d => (
            <Card key={d.id} className="transition-all hover:shadow-lg hover:border-gold">
              <CardHeader><CardTitle className="text-lg">{getName(d)}</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground">{getDesc(d) || t('common.no_data')}</p></CardContent>
            </Card>
          ))}
          {departments.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">{t('common.no_data')}</p>}
        </div>
      </div>
    );
  }

  // Show colleges for a university
  if (universityId) {
    return (
      <div className="container mx-auto px-4 py-8 animate-fade-in">
        <Link to="/universities">
          <Button variant="ghost" className="mb-4"><ArrowRight className="h-4 w-4 rotate-180 me-2" />{t('universities.back')}</Button>
        </Link>
        <h1 className="mb-6 text-3xl font-bold text-foreground">{currentUni && getName(currentUni)} - {t('universities.colleges')}</h1>
        {currentUni?.description_ar && <p className="mb-6 text-muted-foreground">{getDesc(currentUni)}</p>}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {colleges.map(c => (
            <Link key={c.id} to={`/universities/${universityId}/colleges/${c.id}`}>
              <Card className="transition-all hover:shadow-lg hover:border-gold cursor-pointer">
                <CardHeader><CardTitle className="text-lg">{getName(c)}</CardTitle></CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground line-clamp-2">{getDesc(c) || ''}</p>
                  <Arrow className="h-5 w-5 text-gold shrink-0" />
                </CardContent>
              </Card>
            </Link>
          ))}
          {colleges.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">{t('common.no_data')}</p>}
        </div>
      </div>
    );
  }

  // Show all universities
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="mb-6 text-3xl font-bold text-foreground">{t('universities.title')}</h1>
      <div className="relative mb-6">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={t('universities.search')} value={search} onChange={e => setSearch(e.target.value)} className="ps-10" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUniversities.map(u => (
          <Link key={u.id} to={`/universities/${u.id}`}>
            <Card className="transition-all hover:shadow-lg hover:border-gold cursor-pointer">
              <CardHeader className="flex-row items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary shrink-0">
                  <Building2 className="h-6 w-6 text-gold" />
                </div>
                <CardTitle className="text-lg">{getName(u)}</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground line-clamp-2">{getDesc(u) || ''}</p>
                <Arrow className="h-5 w-5 text-gold shrink-0" />
              </CardContent>
            </Card>
          </Link>
        ))}
        {filteredUniversities.length === 0 && <p className="col-span-full text-center text-muted-foreground py-12">{t('common.no_data')}</p>}
      </div>
    </div>
  );
};

export default Universities;
