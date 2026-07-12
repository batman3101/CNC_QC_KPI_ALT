-- Backfill public.users rows for auth accounts created before the
-- on_auth_user_created trigger existed.
--
-- Every RLS helper (current_user_role, can_access_factory,
-- has_feature_permission) resolves through public.users and collapses to false
-- when the row is absent, so these accounts could authenticate but were denied
-- every read and every write.
--
-- Factory codes are written literally rather than read from raw_user_meta_data:
-- 20260711_harden_auth_role_integrity.sql deliberately stopped trusting sign-up
-- metadata for role/factory assignment, and this backfill must not reintroduce
-- that path. Both accounts below were reviewed against their sign-in history.
--
-- Deliberately NOT restored:
--   papapapa@gmail.com        - no factory assignment, single sign-in in Jan
--   buidiem09179998@gmail.com - typo duplicate of buidiem0917998, never signed in

INSERT INTO public.users (id, email, name, role, factory_id)
VALUES
  (
    'f9fc14ba-bfc7-4cd2-85d7-cc3bc90d9a4b',
    'oanhtay82@gmail.com',
    'NÔNG THỊ OANH',
    'inspector'::public.user_role,
    'ALT'
  ),
  (
    '2b0c0d64-3123-4a6a-a067-01066af92395',
    'buidiem0917998@gmail.com',
    'BÙI NGỌC DIỄM',
    'inspector'::public.user_role,
    'ALV'
  )
ON CONFLICT (id) DO NOTHING;
