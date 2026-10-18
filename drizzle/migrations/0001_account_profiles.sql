CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 100),
 company text NOT NULL DEFAULT '' CHECK (char_length(company) <= 160),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_read_own ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.create_account_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.profiles (id, display_name, company)
 VALUES (NEW.id, left(trim(coalesce(NEW.raw_user_meta_data->>'display_name', '')),100), left(trim(coalesce(NEW.raw_user_meta_data->>'company', '')),160))
 ON CONFLICT (id) DO NOTHING;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_account_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER capta_create_account_profile AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_account_profile();
INSERT INTO public.profiles (id, display_name, company) SELECT id, left(trim(coalesce(raw_user_meta_data->>'display_name','')),100), left(trim(coalesce(raw_user_meta_data->>'company','')),160) FROM auth.users ON CONFLICT (id) DO NOTHING;