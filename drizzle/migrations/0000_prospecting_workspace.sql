CREATE TABLE public.prospecting_workspaces (user_id uuid PRIMARY KEY, revision integer NOT NULL DEFAULT 0, payload jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE ON public.prospecting_workspaces TO authenticated;
GRANT ALL ON public.prospecting_workspaces TO service_role;
ALTER TABLE public.prospecting_workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_workspace ON public.prospecting_workspaces FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE FUNCTION public.save_prospecting_workspace(expected_revision integer, new_payload jsonb) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$ DECLARE next_revision integer; BEGIN INSERT INTO public.prospecting_workspaces(user_id) VALUES (auth.uid()) ON CONFLICT DO NOTHING; UPDATE public.prospecting_workspaces SET payload = new_payload, revision = revision + 1, updated_at = now() WHERE user_id = auth.uid() AND revision = expected_revision RETURNING revision INTO next_revision; IF next_revision IS NULL THEN RAISE EXCEPTION 'Conflicto: actualiza los datos antes de guardar'; END IF; RETURN next_revision; END; $$;
REVOKE ALL ON FUNCTION public.save_prospecting_workspace(integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_prospecting_workspace(integer,jsonb) TO authenticated;