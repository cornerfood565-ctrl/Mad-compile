-- Mad-compile initial schema
-- Run this entire file in Supabase SQL Editor. Never paste the filename as SQL.
create extension if not exists pgcrypto;

create type public.workspace_role as enum ('owner', 'admin', 'editor', 'viewer');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  joined_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text not null default '',
  category text,
  language text,
  framework text,
  repository_url text,
  status text not null default 'planning' check (status in ('planning','active','paused','completed','archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.folders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  parent_id uuid references public.folders(id) on delete cascade,
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.source_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,
  name text not null,
  language text,
  storage_path text,
  text_content text,
  size_bytes bigint not null default 0,
  is_favorite boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (storage_path is not null or text_content is not null)
);

create table public.file_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references public.source_files(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  version_number integer not null,
  storage_path text,
  text_content text,
  change_note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (file_id, version_number)
);

create table public.code_snippets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title text not null,
  description text not null default '',
  language text,
  code text not null,
  is_favorite boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.configurations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  format text,
  content text not null default '',
  is_sensitive boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.developer_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  body text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  color text not null default '#d74750',
  unique (workspace_id, name)
);

create table public.item_tags (
  tag_id uuid not null references public.tags(id) on delete cascade,
  item_type text not null check (item_type in ('project','source_file','snippet','asset','configuration','note')),
  item_id uuid not null,
  primary key (tag_id, item_type, item_id)
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  item_type text,
  item_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role public.workspace_role not null default 'viewer',
  invited_by uuid not null references auth.users(id),
  token_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index projects_workspace_idx on public.projects(workspace_id);
create index source_files_workspace_idx on public.source_files(workspace_id);
create index source_files_project_idx on public.source_files(project_id);
create index assets_workspace_idx on public.assets(workspace_id);
create index notes_workspace_idx on public.developer_notes(workspace_id);
create index activity_workspace_created_idx on public.activity_logs(workspace_id, created_at desc);

create or replace function public.is_workspace_member(target_workspace uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_workspace_role(target_workspace uuid, allowed_roles public.workspace_role[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members m
    where m.workspace_id = target_workspace
      and m.user_id = (select auth.uid())
      and m.role = any(allowed_roles)
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare new_workspace uuid;
declare base_slug text;
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));

  base_slug := 'workspace-' || substr(new.id::text, 1, 8);
  insert into public.workspaces (name, slug, created_by)
  values ('My workspace', base_slug, new.id)
  returning id into new_workspace;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace, new.id, 'owner');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare tbl text;
begin
  foreach tbl in array array['profiles','workspaces','projects','source_files','code_snippets','configurations','developer_notes'] loop
    execute format('create trigger touch_%I_updated_at before update on public.%I for each row execute procedure public.touch_updated_at()', tbl, tbl);
  end loop;
end $$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.folders enable row level security;
alter table public.source_files enable row level security;
alter table public.file_versions enable row level security;
alter table public.code_snippets enable row level security;
alter table public.assets enable row level security;
alter table public.configurations enable row level security;
alter table public.developer_notes enable row level security;
alter table public.tags enable row level security;
alter table public.item_tags enable row level security;
alter table public.activity_logs enable row level security;
alter table public.invitations enable row level security;

create policy "Profiles readable by authenticated users" on public.profiles for select to authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "Members read workspace" on public.workspaces for select to authenticated using (public.is_workspace_member(id));
create policy "Owners and admins update workspace" on public.workspaces for update to authenticated using (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[])) with check (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));
create policy "Owners create workspace" on public.workspaces for insert to authenticated with check (created_by = (select auth.uid()));

create policy "Members read membership" on public.workspace_members for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Admins manage membership" on public.workspace_members for all to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy "Members read projects" on public.projects for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Editors manage projects" on public.projects for all to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Members read folders" on public.folders for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Editors manage folders" on public.folders for all to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Members read source files" on public.source_files for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Editors manage source files" on public.source_files for all to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Members read versions" on public.file_versions for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Editors manage versions" on public.file_versions for all to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Members read snippets" on public.code_snippets for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Editors manage snippets" on public.code_snippets for all to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Members read assets" on public.assets for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Editors manage assets" on public.assets for all to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Members read configs" on public.configurations for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Editors manage configs" on public.configurations for all to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Members read notes" on public.developer_notes for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Editors manage notes" on public.developer_notes for all to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Members read tags" on public.tags for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Editors manage tags" on public.tags for all to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[])) with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Members read item tags" on public.item_tags for select to authenticated using (exists (select 1 from public.tags t where t.id = tag_id and public.is_workspace_member(t.workspace_id)));
create policy "Editors manage item tags" on public.item_tags for all to authenticated using (exists (select 1 from public.tags t where t.id = tag_id and public.has_workspace_role(t.workspace_id, array['owner','admin','editor']::public.workspace_role[]))) with check (exists (select 1 from public.tags t where t.id = tag_id and public.has_workspace_role(t.workspace_id, array['owner','admin','editor']::public.workspace_role[])));

create policy "Members read activity" on public.activity_logs for select to authenticated using (public.is_workspace_member(workspace_id));
create policy "Members add activity" on public.activity_logs for insert to authenticated with check (public.is_workspace_member(workspace_id) and actor_id = (select auth.uid()));

create policy "Admins read invitations" on public.invitations for select to authenticated using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
create policy "Admins create invitations" on public.invitations for insert to authenticated with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]) and invited_by = (select auth.uid()));

-- Private storage buckets. Upload object paths must start with the workspace UUID.
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('source-files','source-files',false,10485760),
  ('project-assets','project-assets',false,52428800),
  ('archives','archives',false,104857600),
  ('documents','documents',false,26214400),
  ('private-configs','private-configs',false,10485760)
on conflict (id) do nothing;

create policy "Workspace members read storage" on storage.objects
for select to authenticated using (
  bucket_id in ('source-files','project-assets','archives','documents','private-configs')
  and public.is_workspace_member(((storage.foldername(name))[1])::uuid)
);
create policy "Workspace editors upload storage" on storage.objects
for insert to authenticated with check (
  bucket_id in ('source-files','project-assets','archives','documents','private-configs')
  and public.has_workspace_role(((storage.foldername(name))[1])::uuid, array['owner','admin','editor']::public.workspace_role[])
);
create policy "Workspace editors update storage" on storage.objects
for update to authenticated using (
  bucket_id in ('source-files','project-assets','archives','documents','private-configs')
  and public.has_workspace_role(((storage.foldername(name))[1])::uuid, array['owner','admin','editor']::public.workspace_role[])
) with check (
  bucket_id in ('source-files','project-assets','archives','documents','private-configs')
  and public.has_workspace_role(((storage.foldername(name))[1])::uuid, array['owner','admin','editor']::public.workspace_role[])
);
create policy "Workspace admins delete storage" on storage.objects
for delete to authenticated using (
  bucket_id in ('source-files','project-assets','archives','documents','private-configs')
  and public.has_workspace_role(((storage.foldername(name))[1])::uuid, array['owner','admin']::public.workspace_role[])
);
