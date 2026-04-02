-- =============================================
-- QA Test Users for E2E Testing
-- Creates 4 auth users with email/password login
-- so QA can test cross-role flows via real Supabase sessions.
--
-- Login: supabase.auth.signInWithPassword({ email, password })
-- Password for all: QaTest2026!
-- =============================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fixed UUIDs for test users
DO $$
DECLARE
  v_client_id     UUID := '00000000-0000-4000-a000-000000000001';
  v_master_id     UUID := '00000000-0000-4000-a000-000000000002';
  v_supervisor_id UUID := '00000000-0000-4000-a000-000000000003';
  v_admin_id      UUID := '00000000-0000-4000-a000-000000000004';
  v_password_hash TEXT;
  v_now           TIMESTAMPTZ := NOW();
BEGIN
  -- Bcrypt hash for 'QaTest2026!'
  v_password_hash := crypt('QaTest2026!', gen_salt('bf'));

  -- ── 1. Create auth.users entries ──

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role, confirmation_token
  ) VALUES
    (v_client_id, '00000000-0000-0000-0000-000000000000',
     'qa-client@test.buroremontov.ru', v_password_hash,
     v_now, v_now, v_now,
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"QA Клиент"}'::jsonb,
     'authenticated', 'authenticated', ''),
    (v_master_id, '00000000-0000-0000-0000-000000000000',
     'qa-master@test.buroremontov.ru', v_password_hash,
     v_now, v_now, v_now,
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"QA Мастер"}'::jsonb,
     'authenticated', 'authenticated', ''),
    (v_supervisor_id, '00000000-0000-0000-0000-000000000000',
     'qa-supervisor@test.buroremontov.ru', v_password_hash,
     v_now, v_now, v_now,
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"QA Супервайзер"}'::jsonb,
     'authenticated', 'authenticated', ''),
    (v_admin_id, '00000000-0000-0000-0000-000000000000',
     'qa-admin@test.buroremontov.ru', v_password_hash,
     v_now, v_now, v_now,
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"name":"QA Админ"}'::jsonb,
     'authenticated', 'authenticated', '')
  ON CONFLICT (id) DO NOTHING;

  -- ── 2. Create auth.identities (required by Supabase Auth) ──

  INSERT INTO auth.identities (
    id, user_id, provider_id, provider,
    identity_data, last_sign_in_at, created_at, updated_at
  ) VALUES
    (v_client_id, v_client_id, 'qa-client@test.buroremontov.ru', 'email',
     jsonb_build_object('sub', v_client_id::text, 'email', 'qa-client@test.buroremontov.ru'),
     v_now, v_now, v_now),
    (v_master_id, v_master_id, 'qa-master@test.buroremontov.ru', 'email',
     jsonb_build_object('sub', v_master_id::text, 'email', 'qa-master@test.buroremontov.ru'),
     v_now, v_now, v_now),
    (v_supervisor_id, v_supervisor_id, 'qa-supervisor@test.buroremontov.ru', 'email',
     jsonb_build_object('sub', v_supervisor_id::text, 'email', 'qa-supervisor@test.buroremontov.ru'),
     v_now, v_now, v_now),
    (v_admin_id, v_admin_id, 'qa-admin@test.buroremontov.ru', 'email',
     jsonb_build_object('sub', v_admin_id::text, 'email', 'qa-admin@test.buroremontov.ru'),
     v_now, v_now, v_now)
  ON CONFLICT DO NOTHING;

  -- ── 3. Create profiles ──

  INSERT INTO profiles (id, phone, name, role, is_active, created_at)
  VALUES
    (v_client_id, '+7 900 000 0001', 'QA Клиент', 'client', true, v_now),
    (v_master_id, '+7 900 000 0002', 'QA Мастер', 'master', true, v_now),
    (v_supervisor_id, '+7 900 000 0003', 'QA Супервайзер', 'supervisor', true, v_now),
    (v_admin_id, '+7 900 000 0004', 'QA Админ', 'admin', true, v_now)
  ON CONFLICT (id) DO NOTHING;

  -- ── 4. Create master_profiles for master user ──

  INSERT INTO master_profiles (id, specializations, rating, reviews_count, is_verified)
  VALUES (v_master_id, ARRAY['plumbing', 'electrical', 'tiling'], 0.0, 0, false)
  ON CONFLICT (id) DO NOTHING;

  -- ── 5. Create supervisor_profiles for supervisor user ──

  INSERT INTO supervisor_profiles (id, experience, specializations, regions, about, is_verified)
  VALUES (v_supervisor_id, '5_10', ARRAY['renovation', 'construction'], ARRAY['Москва'], 'QA тестовый супервайзер', false)
  ON CONFLICT (id) DO NOTHING;

END $$;
