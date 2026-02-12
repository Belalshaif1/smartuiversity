
-- ============================================
-- 1. ENUMS
-- ============================================
CREATE TYPE public.app_role AS ENUM ('super_admin', 'university_admin', 'college_admin', 'department_admin');

-- ============================================
-- 2. BASE TABLES
-- ============================================

-- Universities
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  logo_url TEXT,
  guide_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Colleges
CREATE TABLE public.colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  logo_url TEXT,
  guide_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  study_plan_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles (separate table for RBAC)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role, university_id, college_id, department_id)
);

-- Graduates
CREATE TABLE public.graduates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  full_name_ar TEXT NOT NULL,
  full_name_en TEXT,
  graduation_year INTEGER NOT NULL,
  gpa NUMERIC(3,2),
  specialization_ar TEXT,
  specialization_en TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Research
CREATE TABLE public.research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  abstract_ar TEXT,
  abstract_en TEXT,
  author_name TEXT NOT NULL,
  pdf_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  publish_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fees
CREATE TABLE public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL DEFAULT 'public', -- 'public' or 'private'
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IQD',
  academic_year TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  content_ar TEXT NOT NULL,
  content_en TEXT,
  image_url TEXT,
  scope TEXT NOT NULL DEFAULT 'global', -- 'global', 'university', 'college'
  university_id UUID REFERENCES public.universities(id) ON DELETE CASCADE,
  college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id UUID NOT NULL REFERENCES public.colleges(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT NOT NULL,
  description_en TEXT,
  requirements_ar TEXT,
  requirements_en TEXT,
  deadline DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Messages (real-time chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Services
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT,
  description_en TEXT,
  icon TEXT,
  link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 3. INDEXES
-- ============================================
CREATE INDEX idx_colleges_university ON public.colleges(university_id);
CREATE INDEX idx_departments_college ON public.departments(college_id);
CREATE INDEX idx_graduates_department ON public.graduates(department_id);
CREATE INDEX idx_research_department ON public.research(department_id);
CREATE INDEX idx_fees_department ON public.fees(department_id);
CREATE INDEX idx_announcements_scope ON public.announcements(scope);
CREATE INDEX idx_jobs_college ON public.jobs(college_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- ============================================
-- 4. TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON public.universities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON public.colleges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_graduates_updated_at BEFORE UPDATE ON public.graduates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_research_updated_at BEFORE UPDATE ON public.research FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fees_updated_at BEFORE UPDATE ON public.fees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. SECURITY DEFINER HELPER FUNCTIONS
-- ============================================

-- Check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Check if user has admin scope over a university
CREATE OR REPLACE FUNCTION public.has_university_access(_user_id UUID, _university_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'super_admin'
        OR (role = 'university_admin' AND university_id = _university_id)
        OR (role = 'college_admin' AND university_id = _university_id)
        OR (role = 'department_admin' AND university_id = _university_id)
      )
  );
$$;

-- Check if user has admin scope over a college
CREATE OR REPLACE FUNCTION public.has_college_access(_user_id UUID, _college_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'super_admin'
        OR (role = 'university_admin' AND university_id = (SELECT university_id FROM public.colleges WHERE id = _college_id))
        OR (role = 'college_admin' AND college_id = _college_id)
        OR (role = 'department_admin' AND college_id = _college_id)
      )
  );
$$;

-- Check if user has admin scope over a department
CREATE OR REPLACE FUNCTION public.has_department_access(_user_id UUID, _department_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = 'super_admin'
        OR (role = 'university_admin' AND university_id = (SELECT c.university_id FROM public.departments d JOIN public.colleges c ON d.college_id = c.id WHERE d.id = _department_id))
        OR (role = 'college_admin' AND college_id = (SELECT college_id FROM public.departments WHERE id = _department_id))
        OR (role = 'department_admin' AND department_id = _department_id)
      )
  );
$$;

-- Get user's role info
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(role app_role, university_id UUID, college_id UUID, department_id UUID)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ur.role, ur.university_id, ur.college_id, ur.department_id
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
  ORDER BY
    CASE ur.role
      WHEN 'super_admin' THEN 1
      WHEN 'university_admin' THEN 2
      WHEN 'college_admin' THEN 3
      WHEN 'department_admin' THEN 4
    END
  LIMIT 1;
$$;

-- ============================================
-- 7. ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graduates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 8. RLS POLICIES
-- ============================================

-- UNIVERSITIES: Public read, super_admin write
CREATE POLICY "Anyone can view universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Super admins can insert universities" ON public.universities FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins can update universities" ON public.universities FOR UPDATE TO authenticated USING (public.is_super_admin() OR public.has_university_access(auth.uid(), id));
CREATE POLICY "Super admins can delete universities" ON public.universities FOR DELETE TO authenticated USING (public.is_super_admin());

-- COLLEGES: Public read, university_admin+ write
CREATE POLICY "Anyone can view colleges" ON public.colleges FOR SELECT USING (true);
CREATE POLICY "Admins can insert colleges" ON public.colleges FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR public.has_university_access(auth.uid(), university_id));
CREATE POLICY "Admins can update colleges" ON public.colleges FOR UPDATE TO authenticated USING (public.is_super_admin() OR public.has_college_access(auth.uid(), id));
CREATE POLICY "Admins can delete colleges" ON public.colleges FOR DELETE TO authenticated USING (public.is_super_admin() OR public.has_university_access(auth.uid(), university_id));

-- DEPARTMENTS: Public read, college_admin+ write
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins can insert departments" ON public.departments FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR public.has_college_access(auth.uid(), college_id));
CREATE POLICY "Admins can update departments" ON public.departments FOR UPDATE TO authenticated USING (public.is_super_admin() OR public.has_department_access(auth.uid(), id));
CREATE POLICY "Admins can delete departments" ON public.departments FOR DELETE TO authenticated USING (public.is_super_admin() OR public.has_college_access(auth.uid(), college_id));

-- PROFILES
CREATE POLICY "Anyone can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Super admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.is_super_admin());

-- USER ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Super admins can manage roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_super_admin());

-- GRADUATES: Public read, department_admin+ write
CREATE POLICY "Anyone can view graduates" ON public.graduates FOR SELECT USING (true);
CREATE POLICY "Admins can insert graduates" ON public.graduates FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR public.has_department_access(auth.uid(), department_id));
CREATE POLICY "Admins can update graduates" ON public.graduates FOR UPDATE TO authenticated USING (public.is_super_admin() OR public.has_department_access(auth.uid(), department_id));
CREATE POLICY "Admins can delete graduates" ON public.graduates FOR DELETE TO authenticated USING (public.is_super_admin() OR public.has_department_access(auth.uid(), department_id));

-- RESEARCH: Public read (published), department_admin+ write
CREATE POLICY "Anyone can view published research" ON public.research FOR SELECT USING (published = true OR public.is_super_admin() OR public.has_department_access(auth.uid(), department_id));
CREATE POLICY "Admins can insert research" ON public.research FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR public.has_department_access(auth.uid(), department_id));
CREATE POLICY "Admins can update research" ON public.research FOR UPDATE TO authenticated USING (public.is_super_admin() OR public.has_department_access(auth.uid(), department_id));
CREATE POLICY "Admins can delete research" ON public.research FOR DELETE TO authenticated USING (public.is_super_admin() OR public.has_department_access(auth.uid(), department_id));

-- FEES: Public read, university_admin+ write
CREATE POLICY "Anyone can view fees" ON public.fees FOR SELECT USING (true);
CREATE POLICY "Admins can insert fees" ON public.fees FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR public.has_department_access(auth.uid(), department_id));
CREATE POLICY "Admins can update fees" ON public.fees FOR UPDATE TO authenticated USING (public.is_super_admin() OR public.has_department_access(auth.uid(), department_id));
CREATE POLICY "Admins can delete fees" ON public.fees FOR DELETE TO authenticated USING (public.is_super_admin() OR public.has_department_access(auth.uid(), department_id));

-- ANNOUNCEMENTS: Public read (global), scoped write
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (
  public.is_super_admin()
  OR (scope = 'university' AND university_id IS NOT NULL AND public.has_university_access(auth.uid(), university_id))
  OR (scope = 'college' AND college_id IS NOT NULL AND public.has_college_access(auth.uid(), college_id))
);
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (
  public.is_super_admin()
  OR (scope = 'university' AND university_id IS NOT NULL AND public.has_university_access(auth.uid(), university_id))
  OR (scope = 'college' AND college_id IS NOT NULL AND public.has_college_access(auth.uid(), college_id))
);
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (
  public.is_super_admin()
  OR (scope = 'university' AND university_id IS NOT NULL AND public.has_university_access(auth.uid(), university_id))
  OR (scope = 'college' AND college_id IS NOT NULL AND public.has_college_access(auth.uid(), college_id))
);

-- JOBS: Public read, college_admin+ write
CREATE POLICY "Anyone can view jobs" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Admins can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR public.has_college_access(auth.uid(), college_id));
CREATE POLICY "Admins can update jobs" ON public.jobs FOR UPDATE TO authenticated USING (public.is_super_admin() OR public.has_college_access(auth.uid(), college_id));
CREATE POLICY "Admins can delete jobs" ON public.jobs FOR DELETE TO authenticated USING (public.is_super_admin() OR public.has_college_access(auth.uid(), college_id));

-- MESSAGES: Users see own messages, admins see scoped
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid() OR public.is_super_admin());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid() OR public.is_super_admin());

-- SERVICES: Public read, super_admin write
CREATE POLICY "Anyone can view services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Super admins can manage services" ON public.services FOR INSERT TO authenticated WITH CHECK (public.is_super_admin());
CREATE POLICY "Super admins can update services" ON public.services FOR UPDATE TO authenticated USING (public.is_super_admin());
CREATE POLICY "Super admins can delete services" ON public.services FOR DELETE TO authenticated USING (public.is_super_admin());

-- ============================================
-- 9. ENABLE REALTIME FOR MESSAGES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ============================================
-- 10. STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('university-files', 'university-files', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('research-files', 'research-files', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Anyone can view university files" ON storage.objects FOR SELECT USING (bucket_id = 'university-files');
CREATE POLICY "Authenticated users can upload university files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'university-files');
CREATE POLICY "Authenticated users can update university files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'university-files');

CREATE POLICY "Anyone can view research files" ON storage.objects FOR SELECT USING (bucket_id = 'research-files');
CREATE POLICY "Authenticated users can upload research files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'research-files');

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
