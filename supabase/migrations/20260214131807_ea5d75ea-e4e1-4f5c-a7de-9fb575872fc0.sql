
-- Add is_active column to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Drop old restrictive RLS policies for user_roles management
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;

-- Allow admins to view roles they manage
CREATE POLICY "Admins can view relevant roles"
ON public.user_roles
FOR SELECT
USING (
  user_id = auth.uid()
  OR is_super_admin()
  OR (
    -- University admin can see college/department admins in their university
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'university_admin'
        AND ur.university_id = public.user_roles.university_id
    )
  )
  OR (
    -- College admin can see department admins in their college
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'college_admin'
        AND ur.college_id = public.user_roles.college_id
    )
  )
);

-- Allow hierarchical insert
CREATE POLICY "Hierarchical admin insert"
ON public.user_roles
FOR INSERT
WITH CHECK (
  is_super_admin()
  OR (
    -- University admin can add college_admin in their university
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'university_admin'
        AND ur.university_id = public.user_roles.university_id
    )
    AND public.user_roles.role IN ('college_admin', 'department_admin')
  )
  OR (
    -- College admin can add department_admin in their college
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'college_admin'
        AND ur.college_id = public.user_roles.college_id
    )
    AND public.user_roles.role = 'department_admin'
  )
);

-- Allow hierarchical update (for is_active toggle)
CREATE POLICY "Hierarchical admin update"
ON public.user_roles
FOR UPDATE
USING (
  is_super_admin()
  OR (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'university_admin'
        AND ur.university_id = public.user_roles.university_id
    )
    AND public.user_roles.role IN ('college_admin', 'department_admin')
  )
  OR (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'college_admin'
        AND ur.college_id = public.user_roles.college_id
    )
    AND public.user_roles.role = 'department_admin'
  )
);

-- Allow hierarchical delete
CREATE POLICY "Hierarchical admin delete"
ON public.user_roles
FOR DELETE
USING (
  is_super_admin()
  OR (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'university_admin'
        AND ur.university_id = public.user_roles.university_id
    )
    AND public.user_roles.role IN ('college_admin', 'department_admin')
  )
  OR (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'college_admin'
        AND ur.college_id = public.user_roles.college_id
    )
    AND public.user_roles.role = 'department_admin'
  )
);
