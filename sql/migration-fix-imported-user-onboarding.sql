-- Migration: fix onboarding for imported users
-- Problem: users imported via CSV exist in public.users but NOT in auth.users.
-- set_pending_user_password only did UPDATE auth.users — which matched 0 rows for imported users.
-- signInWithPassword then failed with "Database error querying schema" because no auth record existed.
-- Fix: if no auth.users row exists for the user, INSERT one before setting the password.

CREATE OR REPLACE FUNCTION public.set_pending_user_password(user_email TEXT, new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    target_id   UUID;
    target_email TEXT;
    auth_exists  BOOLEAN;
BEGIN
    -- Only works for users with status = 'pending_verification'
    SELECT u.id, u.email INTO target_id, target_email
    FROM public.users u
    WHERE u.email = LOWER(TRIM(user_email))
    AND u.status = 'pending_verification'
    LIMIT 1;

    IF target_id IS NULL THEN
        RAISE EXCEPTION 'User not found or not pending verification';
    END IF;

    -- Check if an auth.users row already exists
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = target_id
    ) INTO auth_exists;

    IF auth_exists THEN
        -- Existing auth user — just update the password
        UPDATE auth.users
        SET encrypted_password = crypt(new_password, gen_salt('bf')),
            updated_at          = NOW()
        WHERE id = target_id;
    ELSE
        -- Imported user — create the auth.users row from scratch
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            role,
            aud,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            target_id,
            '00000000-0000-0000-0000-000000000000',
            LOWER(TRIM(user_email)),
            crypt(new_password, gen_salt('bf')),
            NOW(),           -- mark email as confirmed immediately
            'authenticated',
            'authenticated',
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{}'::jsonb,
            FALSE,
            '',
            '',
            '',
            ''
        );

        -- Also create the auth.identities row required for email/password sign-in
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        ) VALUES (
            target_id,
            target_id,
            jsonb_build_object('sub', target_id::text, 'email', LOWER(TRIM(user_email))),
            'email',
            NOW(),
            NOW(),
            NOW()
        )
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_pending_user_password(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.set_pending_user_password(TEXT, TEXT) TO authenticated;
