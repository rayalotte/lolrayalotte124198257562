ALTER TABLE public.characters
  ADD COLUMN attack_types text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN damage_types text[] NOT NULL DEFAULT '{}'::text[];
ALTER TABLE public.characters
  ADD CONSTRAINT characters_attack_types_valid CHECK (attack_types <@ ARRAY['Melee', 'Ranged']::text[]),
  ADD CONSTRAINT characters_damage_types_valid CHECK (damage_types <@ ARRAY['AP', 'AD']::text[]);