
-- Drop the recursive policies
DROP POLICY IF EXISTS "University admin can view sub roles" ON public.user_roles;
DROP POLICY IF EXISTS "College admin can view sub roles" ON public.user_roles;

-- Create security definer functions to check caller's admin scope
CREATE OR REPLACE FUNCTION public.is_university_admin_for(_university_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'university_admin'
      AND university_id = _university_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_college_admin_for(_college_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'college_admin'
      AND college_id = _college_id
  );
$$;

-- Recreate policies using security definer functions (no recursion)
CREATE POLICY "University admin can view sub roles"
ON public.user_roles
FOR SELECT
USING (is_university_admin_for(university_id));

CREATE POLICY "College admin can view sub roles"
ON public.user_roles
FOR SELECT
USING (is_college_admin_for(college_id));
