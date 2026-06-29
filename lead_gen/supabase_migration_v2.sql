-- Migration v2 — شغّل فـ Supabase SQL Editor
-- يزيد status audited + audit_pdf_path + replied_at

alter table leads drop constraint if exists leads_status_check;

alter table leads add column if not exists audit_pdf_path text default '';
alter table leads add column if not exists replied_at timestamptz;

alter table leads add constraint leads_status_check
  check (status in ('new', 'audited', 'sent', 'failed', 'replied'));

create index if not exists leads_audit_pdf_idx on leads(audit_pdf_path)
  where audit_pdf_path != '';
