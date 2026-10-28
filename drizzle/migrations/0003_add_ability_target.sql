ALTER TABLE public.abilities ADD COLUMN target text;
COMMENT ON COLUMN public.abilities.target IS 'Alvo da habilidade (ex.: um inimigo, área, aliado)';