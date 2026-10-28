ALTER TABLE public.characters ADD COLUMN difficulty smallint;
COMMENT ON COLUMN public.characters.difficulty IS 'Character difficulty level: 1 = Fácil, 2 = Média, 3 = Difícil; NULL = not set';