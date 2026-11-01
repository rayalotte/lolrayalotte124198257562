ALTER TABLE public.characters ADD COLUMN power_spike TEXT;
COMMENT ON COLUMN public.characters.power_spike IS 'Pico de poder do personagem: Earlygame, Midgame ou Lategame';