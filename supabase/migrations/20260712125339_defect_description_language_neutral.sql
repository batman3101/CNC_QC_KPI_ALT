-- Stop persisting machine-written Korean prose in defects.description.
--
-- Two code paths auto-created defects with a hardcoded Korean sentence:
--   '검사 불합격'
--   '검사 불합격 - 불량 수량: N'
-- Because the value is persisted, no component-level i18n could undo it: every
-- Vietnamese inspector read those rows in Korean, forever. The second form's
-- only content - the defect quantity - is already a column on the inspection
-- row, so the sentence added no information at all.
--
-- The fix is to store nothing and let the UI render the sentence at display
-- time in the reader's own language. That requires the column to be nullable:
-- the NOT NULL constraint is precisely what forced the code to invent prose.

ALTER TABLE public.defects
  ALTER COLUMN description DROP NOT NULL;

-- Clear the sentences the application generated. The patterns below match only
-- machine-written text; a description an inspector actually typed will not look
-- like this and is left untouched.
UPDATE public.defects
SET description = NULL
WHERE description IN ('검사 불합격', '검사 불합격 ')
   OR description ~ '^검사 불합격 - 불량 수량: [0-9]+$';

-- Treat an empty string the same as absent, so the UI has one case to handle.
UPDATE public.defects
SET description = NULL
WHERE btrim(description) = '';
