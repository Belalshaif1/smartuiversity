
-- Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view relevant roles" ON public.user_roles;
DROP POLICY IF EXISTS "Hierarchical admin insert" ON public.user_roles;
DROP POLICY IF EXISTS "Hierarchical admin update" ON public.user_roles;
DROP POLICY IF EXISTS "Hierarchical admin delete" ON public.user_roles;

-- Recreate SELECT policy without recursion: users see own role, super_admin sees all
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Super admin can view all roles"
ON public.user_roles
FOR SELECT
USING (is_super_admin());

-- For insert/update/delete, use security definer functions only (no subqueries on user_roles)
CREATE POLICY "Super admin can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_super_admin());

CREATE POLICY "Super admin can update roles"
ON public.user_roles
FOR UPDATE
USING (is_super_admin());

CREATE POLICY "Super admin can delete roles"
ON public.user_roles
FOR DELETE
USING (is_super_admin());

-- University admin can view roles in their university
CREATE POLICY "University admin can view sub roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'university_admin'
      AND ur.university_id = user_roles.university_id
  )
);

-- College admin can view roles in their college  
CREATE POLICY "College admin can view sub roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'college_admin'
      AND ur.college_id = user_roles.college_id
  )
);
