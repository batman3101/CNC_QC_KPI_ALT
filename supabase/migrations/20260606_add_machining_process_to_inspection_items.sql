-- Add machining process step (CNC0/CNC1/CNC2...) to inspection items.
-- Free-text, optional column. This is the *manufacturing* operation that produced
-- the part, and is intentionally distinct from the *inspection* process
-- (process_id, which references inspection_processes such as IQC/PQC/OQC).
alter table public.inspection_items
  add column if not exists machining_process text;

comment on column public.inspection_items.machining_process is
  'Machining/manufacturing process step (e.g., CNC0, CNC1, CNC2). Free-text, optional. Distinct from inspection process (process_id).';
