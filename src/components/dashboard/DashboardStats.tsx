import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Building2, BookOpen, FileText, GraduationCap, Users } from 'lucide-react';
import type { DashboardStats as StatsType } from '@/hooks/useDashboardData';

interface Props {
  stats: StatsType;
  role: string;
}

const DashboardStats: React.FC<Props> = ({ stats, role }) => {
  const { t, language } = useLanguage();

  const statCards = [
    { key: 'users', icon: Users, label: language === 'ar' ? 'المستخدمين' : 'Users', show: role === 'super_admin' || role === 'university_admin' || role === 'college_admin' },
    { key: 'universities', icon: Building2, label: t('home.stats.universities'), show: role === 'super_admin' },
    { key: 'colleges', icon: BookOpen, label: t('home.stats.colleges'), show: role !== 'department_admin' },
    { key: 'departments', icon: FileText, label: t('home.stats.departments'), show: true },
    { key: 'graduates', icon: GraduationCap, label: t('home.stats.graduates'), show: true },
    { key: 'research', icon: FileText, label: t('home.stats.research'), show: true },
  ].filter(s => s.show);

  return (
    <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-3 lg:grid-cols-6">
      {statCards.map(s => (
        <Card key={s.key}>
          <CardContent className="flex flex-col items-center p-4 text-center">
            <s.icon className="mb-2 h-6 w-6 text-gold" />
            <span className="text-2xl font-bold">{stats[s.key as keyof StatsType]}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default React.memo(DashboardStats);
