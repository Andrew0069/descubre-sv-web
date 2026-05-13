alter table public.respuestas_resena
add column if not exists parent_respuesta_id uuid null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'respuestas_resena_parent_respuesta_id_fkey'
  ) then
    alter table public.respuestas_resena
    add constraint respuestas_resena_parent_respuesta_id_fkey
    foreign key (parent_respuesta_id)
    references public.respuestas_resena(id)
    on delete cascade;
  end if;
end $$;

create index if not exists respuestas_resena_parent_respuesta_idx
on public.respuestas_resena(parent_respuesta_id);
