import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DashboardStats {
  universities: number;
  colleges: number;
  departments: number;
  graduates: number;
  research: number;
  users: number;
}

const fetchDashboardData = async (role: string, userRole: any) => {
  const usersCount = supabase.from('profiles').select('id', { count: 'exact', head: true });

  if (role === 'super_admin') {
    const [u, c, d, g, r, usersRes] = await Promise.all([
      supabase.from('universities').select('*'),
      supabase.from('colleges').select('*, universities(name_ar, name_en)'),
      supabase.from('departments').select('*, colleges(name_ar, name_en)'),
      supabase.from('graduates').select('id', { count: 'exact', head: true }),
      supabase.from('research').select('id', { count: 'exact', head: true }),
      usersCount,
    ]);
    return {
      universities: u.data || [],
      colleges: c.data || [],
      departments: d.data || [],
      stats: {
        universities: (u.data || []).length,
        colleges: (c.data || []).length,
        departments: (d.data || []).length,
        graduates: g.count || 0,
        research: r.count || 0,
        users: usersRes.count || 0,
      },
    };
  } else if (role === 'university_admin') {
    const uid = userRole.university_id;
    const [c, d, g, r, usersRes] = await Promise.all([
      supabase.from('colleges').select('*, universities(name_ar, name_en)').eq('university_id', uid),
      supabase.from('departments').select('*, colleges(name_ar, name_en)'),
      supabase.from('graduates').select('id', { count: 'exact', head: true }),
      supabase.from('research').select('id', { count: 'exact', head: true }),
      usersCount,
    ]);
    const filteredDepts = (d.data || []).filter((dept: any) => 
      (c.data || []).some((col: any) => col.id === dept.college_id)
    );
    return {
      universities: [],
      colleges: c.data || [],
      departments: filteredDepts,
      stats: {
        universities: 1,
        colleges: (c.data || []).length,
        departments: filteredDepts.length,
        graduates: g.count || 0,
        research: r.count || 0,
        users: usersRes.count || 0,
      },
    };
  } else if (role === 'college_admin') {
    const [d, g, r, usersRes] = await Promise.all([
      supabase.from('departments').select('*, colleges(name_ar, name_en)').eq('college_id', userRole.college_id),
      supabase.from('graduates').select('id', { count: 'exact', head: true }),
      supabase.from('research').select('id', { count: 'exact', head: true }),
      usersCount,
    ]);
    return {
      universities: [],
      colleges: [],
      departments: d.data || [],
      stats: {
        universities: 0,
        colleges: 1,
        departments: (d.data || []).length,
        graduates: g.count || 0,
        research: r.count || 0,
        users: usersRes.count || 0,
      },
    };
  }

  return {
    universities: [],
    colleges: [],
    departments: [],
    stats: { universities: 0, colleges: 0, departments: 0, graduates: 0, research: 0, users: 0 },
  };
};

export const useDashboardData = () => {
  const { user, userRole } = useAuth();
  const queryClient = useQueryClient();
  const role = userRole?.role;

  const query = useQuery({
    queryKey: ['dashboard-data', role, userRole?.university_id, userRole?.college_id],
    queryFn: () => fetchDashboardData(role!, userRole!),
    enabled: !!user && !!userRole,
    staleTime: 30_000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });

  return {
    universities: query.data?.universities || [],
    colleges: query.data?.colleges || [],
    departments: query.data?.departments || [],
    stats: query.data?.stats || { universities: 0, colleges: 0, departments: 0, graduates: 0, research: 0, users: 0 },
    isLoading: query.isLoading,
    refresh,
  };
};
