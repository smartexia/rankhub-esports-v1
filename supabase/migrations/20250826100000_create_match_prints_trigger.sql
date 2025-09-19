create or replace function trigger_process_match_print() 
returns trigger as $$
begin
  perform net.http_post(
    url:=concat(current_setting('supabase.url'), '/functions/v1/process-match-print'),
    headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', concat('Bearer ', current_setting('supabase.service_role_key'))
    ),
    body:=jsonb_build_object('record', new)
  );
  return new;
end;
$$ language plpgsql;

create trigger on_match_print_inserted
after insert on match_prints
for each row execute procedure trigger_process_match_print();