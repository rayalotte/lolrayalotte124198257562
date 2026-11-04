CREATE TABLE public.item_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image text,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_library TO authenticated;
GRANT ALL ON public.item_library TO service_role;
ALTER TABLE public.item_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin access item library" ON public.item_library FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE OR REPLACE FUNCTION public.sync_library_item_snapshots() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.characters c SET items = (
    SELECT jsonb_agg(CASE WHEN entry->>'library_id' = NEW.id::text THEN entry || jsonb_build_object('name', NEW.name, 'image', NEW.image, 'description', NEW.description) ELSE entry END ORDER BY ord)
    FROM jsonb_array_elements(c.items) WITH ORDINALITY AS t(entry, ord)
  ), updated_at = now()
  WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(c.items) AS entry WHERE entry->>'library_id' = NEW.id::text);
  RETURN NEW;
END;
$$;
CREATE TRIGGER sync_library_item_snapshots AFTER UPDATE OF name, description, image ON public.item_library FOR EACH ROW EXECUTE FUNCTION public.sync_library_item_snapshots();