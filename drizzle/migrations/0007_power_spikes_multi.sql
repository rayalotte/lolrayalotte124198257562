ALTER TABLE public.characters ADD COLUMN power_spikes text[] NOT NULL DEFAULT '{}';
UPDATE public.characters SET power_spikes = ARRAY[power_spike] WHERE power_spike IS NOT NULL AND power_spike <> '';
ALTER TABLE public.characters ADD CONSTRAINT characters_power_spikes_check CHECK (power_spikes <@ ARRAY['Earlygame','Midgame','Lategame']::text[]);
COMMENT ON COLUMN public.characters.power_spike IS 'DEPRECATED: replaced by power_spikes (text[])';