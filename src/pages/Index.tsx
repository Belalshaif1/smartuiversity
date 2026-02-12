import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, GraduationCap, FileText, BookOpen, Megaphone, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const [stats, setStats] = useState({ universities: 0, colleges: 0, departments: 0, graduates: 0, research: 0 });
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [u, c, d, g, r] = await Promise.all([
        supabase.from('universities').select('id', { count: 'exact', head: true }),
        supabase.from('colleges').select('id', { count: 'exact', head: true }),
        supabase.from('departments').select('id', { count: 'exact', head: true }),
        supabase.from('graduates').select('id', { count: 'exact', head: true }),
        supabase.from('research').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        universities: u.count || 0, colleges: c.count || 0, departments: d.count || 0,
        graduates: g.count || 0, research: r.count || 0,
      });
    };
    const fetchAnnouncements = async () => {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false }).limit(3);
      setAnnouncements(data || []);
    };
    fetchStats();
    fetchAnnouncements();
  }, []);

  const statItems = [
    { key: 'universities', icon: Building2, color: 'text-primary' },
    { key: 'colleges', icon: BookOpen, color: 'text-gold' },
    { key: 'departments', icon: FileText, color: 'text-primary' },
    { key: 'graduates', icon: GraduationCap, color: 'text-gold' },
    { key: 'research', icon: FileText, color: 'text-primary' },
  ];

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="gradient-academic py-16 text-center text-primary-foreground md:py-24">
        <div className="container mx-auto px-4">
          <GraduationCap className="mx-auto mb-4 h-16 w-16 text-gold" />
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">{t('home.welcome')}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg opacity-90">{t('home.subtitle')}</p>
          <Link to="/universities">
            <Button size="lg" className="bg-gold text-gold-foreground hover:bg-gold/90">
              {t('home.explore')}
              <Arrow className="ms-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto -mt-8 px-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {statItems.map((item) => (
            <Card key={item.key} className="border-none shadow-lg">
              <CardContent className="flex flex-col items-center p-4 text-center">
                <item.icon className={`mb-2 h-8 w-8 ${item.color}`} />
                <span className="text-2xl font-bold text-foreground">{stats[item.key as keyof typeof stats]}</span>
                <span className="text-sm text-muted-foreground">{t(`home.stats.${item.key}`)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick links */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold text-foreground">{t('home.quick_links')}</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { path: '/universities', label: t('nav.universities'), icon: Building2 },
            { path: '/research', label: t('nav.research'), icon: FileText },
            { path: '/jobs', label: t('nav.jobs'), icon: GraduationCap },
            { path: '/fees', label: t('nav.fees'), icon: BookOpen },
          ].map((link) => (
            <Link key={link.path} to={link.path}>
              <Card className="transition-all hover:shadow-lg hover:border-gold">
                <CardContent className="flex flex-col items-center gap-2 p-6">
                  <link.icon className="h-8 w-8 text-gold" />
                  <span className="font-semibold text-foreground">{link.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest Announcements */}
      {announcements.length > 0 && (
        <section className="container mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">{t('home.latest_announcements')}</h2>
            <Link to="/announcements">
              <Button variant="outline" size="sm">{t('common.view_all')}</Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {announcements.map((a) => (
              <Card key={a.id} className="transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <h3 className="mb-2 font-bold text-foreground">{language === 'ar' ? a.title_ar : (a.title_en || a.title_ar)}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{language === 'ar' ? a.content_ar : (a.content_en || a.content_ar)}</p>
                  <span className="mt-2 block text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString(language === 'ar' ? 'ar-IQ' : 'en-US')}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
