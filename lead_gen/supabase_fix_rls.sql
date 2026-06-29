-- شغل هاد SQL فـ Supabase SQL Editor (مرة واحدة)
-- يصلح RLS باش Python agent يقدر يقرا ويكتب بـ anon key

drop policy if exists "Allow anon access" on leads;

create policy "Allow anon access"
  on leads for all
  to anon
  using (true)
  with check (true);
