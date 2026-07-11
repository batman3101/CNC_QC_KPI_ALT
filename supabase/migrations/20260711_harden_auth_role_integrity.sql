-- Prevent public sign-up metadata from assigning privileged application roles or factories.
-- Privileged user provisioning is handled by the authenticated admin-create-user Edge Function.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, factory_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    'inspector'::public.user_role,
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name);

  RETURN NEW;
END
$$;

ALTER FUNCTION public.get_user_factory_id() SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_user_role() SET search_path = pg_catalog, public;
ALTER FUNCTION public.is_admin_user() SET search_path = pg_catalog, public;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_factory_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC, anon, authenticated;
