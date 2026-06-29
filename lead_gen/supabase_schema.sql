-- جدول الـ leads فـ Supabase
-- شغل هاد الـ SQL فـ Supabase SQL Editor

create table if not exists leads (
  id            bigint        generated always as identity primary key,
  business_name text          not null default '',
  phone         text          unique,
  email         text          default '',
  website       text          default '',
  rating        numeric(2,1)  default 0,
  address       text          default '',
  problems_found text         default '',
  message_sent  text          default '',
  status        text          not null default 'new'
                              check (status in ('new', 'audited', 'sent', 'failed', 'replied')),
  audit_pdf_path text         default '',
  replied_at    timestamptz,
  created_at    timestamptz   not null default now()
);

-- Index للبحث السريع
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_phone_idx  on leads(phone);

-- Row Level Security
alter table leads enable row level security;

-- Python agent كيستعمل anon key — خاص policies لـ anon
drop policy if exists "Allow all for authenticated" on leads;
drop policy if exists "Allow anon access" on leads;

create policy "Allow anon access"
  on leads for all
  to anon
  using (true)
  with check (true);

create policy "Allow all for authenticated"
  on leads for all
  to authenticated
  using (true)
  with check (true);
