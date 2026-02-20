import React, { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, UserCheck, Shield, Search, Plus } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  role?: string;
  is_active?: boolean;
}

interface Props {
  onAddAdmin: () => void;
}

const UserManagementTable: React.FC<Props> = ({ onAddAdmin }) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const isAr = language === 'ar';

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active !== false).length,
    admins: users.filter(u => u.role).length,
    inactive: users.filter(u => u.is_active === false).length,
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, phone, created_at')
      .order('created_at', { ascending: false });

    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role, is_active');

    const roleMap = new Map(roles?.map(r => [r.user_id, r]) || []);
    const enriched = (profiles || []).map(p => ({
      ...p,
      role: roleMap.get(p.user_id)?.role || undefined,
      is_active: roleMap.get(p.user_id)?.is_active ?? true,
    }));
    setUsers(enriched);
    setLoading(false);
  };

  const getRoleName = (r?: string) => {
    if (!r) return isAr ? 'مستخدم' : 'User';
    const names: Record<string, Record<string, string>> = {
      super_admin: { ar: 'مدير النظام', en: 'Super Admin' },
      university_admin: { ar: 'مدير جامعة', en: 'University Admin' },
      college_admin: { ar: 'مدير كلية', en: 'College Admin' },
      department_admin: { ar: 'مدير قسم', en: 'Department Admin' },
    };
    return names[r]?.[language] || r;
  };

  const getRoleBadgeVariant = (r?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (!r) return 'outline';
    if (r === 'super_admin') return 'destructive';
    return 'default';
  };

  const filtered = users.filter(u =>
    !search || u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const statCards = [
    { icon: Users, label: isAr ? 'إجمالي المستخدمين' : 'Total Users', value: stats.total, color: 'text-primary' },
    { icon: UserCheck, label: isAr ? 'مستخدمين نشطين' : 'Active Users', value: stats.active, color: 'text-green-600' },
    { icon: Shield, label: isAr ? 'مديري النظام' : 'Admins', value: stats.admins, color: 'text-accent' },
    { icon: Users, label: isAr ? 'مستخدمين موقوفين' : 'Inactive', value: stats.inactive, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((s, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-full p-2 bg-muted`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button onClick={onAddAdmin} className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Plus className="h-4 w-4 me-1" />
          {isAr ? 'إنشاء حساب جديد' : 'Create New Account'}
        </Button>
        <div className="relative w-full sm:w-64">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isAr ? 'بحث...' : 'Search...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>{isAr ? 'المستخدم' : 'User'}</TableHead>
                <TableHead className="hidden md:table-cell">{isAr ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                <TableHead>{isAr ? 'الدور' : 'Role'}</TableHead>
                <TableHead className="hidden md:table-cell">{isAr ? 'النوع' : 'Type'}</TableHead>
                <TableHead className="hidden sm:table-cell">{isAr ? 'الحالة' : 'Status'}</TableHead>
                <TableHead className="hidden lg:table-cell">{isAr ? 'تاريخ الإنشاء' : 'Created'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isAr ? 'جاري التحميل...' : 'Loading...'}
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {isAr ? 'لا يوجد مستخدمين' : 'No users found'}
                  </TableCell>
                </TableRow>
              ) : filtered.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatar_url || ''} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                          {u.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{u.full_name || (isAr ? 'بدون اسم' : 'No name')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {u.phone || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(u.role)} className="text-xs">
                      {getRoleName(u.role)}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    {u.role ? (isAr ? 'مدير' : 'Admin') : (isAr ? 'مستخدم' : 'User')}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant={u.is_active ? 'outline' : 'destructive'} className="text-xs">
                      {u.is_active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'موقوف' : 'Inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagementTable;
