
-- Create role_permissions table
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL,
  permission_key TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission_key)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only super_admin can read/write permissions
CREATE POLICY "Super admins can read permissions"
ON public.role_permissions FOR SELECT
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert permissions"
ON public.role_permissions FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update permissions"
ON public.role_permissions FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete permissions"
ON public.role_permissions FOR DELETE
USING (public.is_super_admin(auth.uid()));

-- Insert default permissions for each role
INSERT INTO public.role_permissions (role, permission_key, is_enabled) VALUES
  -- super_admin gets everything
  ('super_admin', 'manage_universities', true),
  ('super_admin', 'manage_colleges', true),
  ('super_admin', 'manage_departments', true),
  ('super_admin', 'manage_users', true),
  ('super_admin', 'manage_announcements', true),
  ('super_admin', 'manage_jobs', true),
  ('super_admin', 'manage_research', true),
  ('super_admin', 'manage_graduates', true),
  ('super_admin', 'manage_fees', true),
  ('super_admin', 'view_reports', true),
  ('super_admin', 'advanced_settings', true),
  -- university_admin
  ('university_admin', 'manage_universities', false),
  ('university_admin', 'manage_colleges', true),
  ('university_admin', 'manage_departments', true),
  ('university_admin', 'manage_users', true),
  ('university_admin', 'manage_announcements', true),
  ('university_admin', 'manage_jobs', true),
  ('university_admin', 'manage_research', true),
  ('university_admin', 'manage_graduates', true),
  ('university_admin', 'manage_fees', true),
  ('university_admin', 'view_reports', true),
  ('university_admin', 'advanced_settings', false),
  -- college_admin
  ('college_admin', 'manage_universities', false),
  ('college_admin', 'manage_colleges', false),
  ('college_admin', 'manage_departments', true),
  ('college_admin', 'manage_users', true),
  ('college_admin', 'manage_announcements', true),
  ('college_admin', 'manage_jobs', true),
  ('college_admin', 'manage_research', true),
  ('college_admin', 'manage_graduates', true),
  ('college_admin', 'manage_fees', false),
  ('college_admin', 'view_reports', true),
  ('college_admin', 'advanced_settings', false),
  -- department_admin
  ('department_admin', 'manage_universities', false),
  ('department_admin', 'manage_colleges', false),
  ('department_admin', 'manage_departments', false),
  ('department_admin', 'manage_users', false),
  ('department_admin', 'manage_announcements', true),
  ('department_admin', 'manage_jobs', false),
  ('department_admin', 'manage_research', true),
  ('department_admin', 'manage_graduates', true),
  ('department_admin', 'manage_fees', false),
  ('department_admin', 'view_reports', false),
  ('department_admin', 'advanced_settings', false);

-- Trigger for updated_at
CREATE TRIGGER update_role_permissions_updated_at
BEFORE UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
