import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, Building2, Briefcase, GraduationCap, FileText, 
  Megaphone, DollarSign, Wrench, MessageCircle, Moon, Sun,
  Globe, LogIn, LogOut, User, LayoutDashboard, Menu, X
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Header: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { toggleTheme, isDark } = useTheme();
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/universities', icon: Building2, label: t('nav.universities') },
    { path: '/services', icon: Wrench, label: t('nav.services') },
    { path: '/jobs', icon: Briefcase, label: t('nav.jobs') },
    { path: '/research', icon: FileText, label: t('nav.research') },
    { path: '/graduates', icon: GraduationCap, label: t('nav.graduates') },
    { path: '/fees', icon: DollarSign, label: t('nav.fees') },
    { path: '/announcements', icon: Megaphone, label: t('nav.announcements') },
    { path: '/chat', icon: MessageCircle, label: t('nav.chat') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-6 w-6 text-gold" />
          </div>
          <span className="hidden text-lg font-bold text-foreground sm:block">
            {language === 'ar' ? 'الدليل الجامعي' : 'UniGuide'}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}>
            <Globe className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          {user ? (
            <div className="flex items-center gap-2">
              {userRole && (
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="hidden sm:flex">
                    <LayoutDashboard className="h-4 w-4" />
                    <span className="hidden lg:inline ms-1">{t('nav.dashboard')}</span>
                  </Button>
                </Link>
              )}
              <Link to="/profile">
                <Button variant="ghost" size="icon">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button size="sm" className="bg-primary text-primary-foreground">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline ms-1">{t('nav.login')}</span>
              </Button>
            </Link>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex flex-col items-center gap-1 rounded-lg p-3 text-xs text-muted-foreground hover:bg-muted"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
