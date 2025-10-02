/*
  # Create Master Admin User

  Creates the initial master administrator user for the system.

  ## User Details
    - Phone: 48991836483
    - Email: 48991836483@confraria.local
    - Password: confraria
    - Role: admin
    - Name: Administrador Master

  ## Security Note
    This is a one-time setup. Change the password immediately after first login.
*/

-- Create the auth user with a known password
-- Note: This uses a hardcoded UUID to ensure idempotency
DO $$
DECLARE
  master_user_id uuid := 'a0000000-0000-0000-0000-000000000001';
  master_email text := '48991836483@confraria.local';
  master_phone text := '48991836483';
  encrypted_password text;
BEGIN
  -- Check if user already exists
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = master_user_id
  ) THEN
    -- Generate password hash for 'confraria'
    -- Using crypt function with bcrypt
    encrypted_password := crypt('confraria', gen_salt('bf'));

    -- Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      aud,
      role
    ) VALUES (
      master_user_id,
      '00000000-0000-0000-0000-000000000000',
      master_email,
      encrypted_password,
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('phone', master_phone),
      now(),
      now(),
      '',
      '',
      '',
      '',
      'authenticated',
      'authenticated'
    );

    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      master_user_id,
      jsonb_build_object(
        'sub', master_user_id::text,
        'email', master_email,
        'phone', master_phone
      ),
      'email',
      now(),
      now(),
      now()
    );

    -- Create profile
    INSERT INTO public.profiles (
      id,
      full_name,
      phone,
      role,
      created_at,
      updated_at
    ) VALUES (
      master_user_id,
      'Administrador Master',
      master_phone,
      'admin',
      now(),
      now()
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Master admin user created successfully';
  ELSE
    RAISE NOTICE 'Master admin user already exists';
  END IF;
END $$;
