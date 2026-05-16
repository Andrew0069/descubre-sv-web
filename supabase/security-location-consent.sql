alter table public.security_logs
  add column if not exists gps_status text,
  add column if not exists gps_error_message text,
  add column if not exists location_consent text;

alter table public.security_logs
  drop constraint if exists security_logs_gps_status_check;

alter table public.security_logs
  add constraint security_logs_gps_status_check
  check (gps_status is null or gps_status in ('granted', 'denied', 'timeout', 'unavailable', 'skipped', 'error'));

alter table public.security_logs
  drop constraint if exists security_logs_location_consent_check;

alter table public.security_logs
  add constraint security_logs_location_consent_check
  check (location_consent is null or location_consent in ('accepted', 'declined', 'dismissed', 'unknown'));

update public.security_logs
set gps_status = case
  when gps_status is not null then gps_status
  when gps_lat is not null and gps_lng is not null then 'granted'
  when gps_denied is true then 'denied'
  else null
end
where gps_status is null;

update public.security_logs
set event_type = 'login_exitoso'
where event_type = 'login';

drop function if exists public.registrar_security_log(
  text,
  text,
  double precision,
  double precision,
  real,
  boolean,
  text,
  text,
  text,
  text,
  text,
  text,
  boolean,
  text
);

create or replace function public.registrar_security_log(
  p_event_type text,
  p_email text default null::text,
  p_gps_lat double precision default null::double precision,
  p_gps_lng double precision default null::double precision,
  p_gps_accuracy_m real default null::real,
  p_gps_denied boolean default false,
  p_ip_address text default null::text,
  p_ip_country_code text default null::text,
  p_ip_country_name text default null::text,
  p_ip_city text default null::text,
  p_ip_region text default null::text,
  p_ip_org text default null::text,
  p_ip_is_proxy boolean default null::boolean,
  p_user_agent text default null::text,
  p_gps_status text default null::text,
  p_gps_error_message text default null::text,
  p_location_consent text default null::text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_new_id        uuid;
  v_rate_key      text;
  v_rate_count    integer;
  v_auth_uid      uuid;
  v_usuario_db_id uuid;
  v_event_type    text;
  v_gps_status    text;
  v_consent       text;
  c_eventos_validos constant text[] := array[
    'login', 'login_exitoso', 'login_fallido', 'logout',
    'registro', 'cambio_password', 'reset_password',
    'cuenta_bloqueada', 'cuenta_desbloqueada',
    'acceso_admin', 'sesion_expirada',
    'intento_acceso_no_autorizado', 'perfil_actualizado',
    'email_verificado', 'oauth_login'
  ];
  c_rate_max       constant integer := 30;
  c_rate_ventana   constant integer := 60;
begin
  if p_event_type != all(c_eventos_validos) then
    raise exception 'event_type no valido: %', p_event_type;
  end if;

  v_event_type := case when p_event_type = 'login' then 'login_exitoso' else p_event_type end;

  v_gps_status := coalesce(
    p_gps_status,
    case
      when p_gps_lat is not null and p_gps_lng is not null then 'granted'
      when coalesce(p_gps_denied, false) then 'denied'
      else null
    end
  );

  if v_gps_status is not null and v_gps_status not in ('granted', 'denied', 'timeout', 'unavailable', 'skipped', 'error') then
    v_gps_status := 'error';
  end if;

  v_consent := coalesce(p_location_consent, 'unknown');
  if v_consent not in ('accepted', 'declined', 'dismissed', 'unknown') then
    v_consent := 'unknown';
  end if;

  v_rate_key := 'seclog:' || coalesce(p_ip_address, p_user_agent, 'unknown');

  select count(*) into v_rate_count
  from rate_limits
  where identificador = v_rate_key
    and accion = 'security_log'
    and ultima_vez > now() - (c_rate_ventana || ' minutes')::interval;

  if v_rate_count >= c_rate_max then
    return null;
  end if;

  insert into rate_limits (identificador, accion)
  values (v_rate_key, 'security_log')
  on conflict do nothing;

  update rate_limits
  set intentos = intentos + 1, ultima_vez = now()
  where identificador = v_rate_key and accion = 'security_log';

  v_auth_uid := auth.uid();
  if v_auth_uid is not null then
    select id into v_usuario_db_id
    from usuarios
    where auth_id = v_auth_uid
    limit 1;
  end if;

  insert into security_logs (
    user_id, usuario_db_id, email, event_type,
    gps_lat, gps_lng, gps_accuracy_m, gps_denied,
    gps_status, gps_error_message, location_consent,
    ip_address, ip_country_code, ip_country_name,
    ip_city, ip_region, ip_org, ip_is_proxy,
    user_agent,
    reviewed, flagged, admin_note
  )
  values (
    v_auth_uid, v_usuario_db_id, p_email, v_event_type,
    p_gps_lat, p_gps_lng, p_gps_accuracy_m, coalesce(v_gps_status = 'denied', false),
    v_gps_status, nullif(left(p_gps_error_message, 240), ''), v_consent,
    p_ip_address, p_ip_country_code, p_ip_country_name,
    p_ip_city, p_ip_region, p_ip_org, p_ip_is_proxy,
    p_user_agent,
    false, false, null
  )
  returning id into v_new_id;

  return v_new_id;
end;
$function$;
