-- Run this whole file in Supabase > SQL Editor.
-- It works on a new database and also updates an existing one.

-- 1) TEMPLATES table (the 3 templates live in the database)
create table if not exists templates (
  id int primary key,
  name text not null,
  description text,
  layout text not null,      -- simple | modern | creative
  bg text, color text, accent text, font text
);

insert into templates (id, name, description, layout, bg, color, accent, font) values
 (1, 'Simple',   'Clean and professional single column.',     'simple',   '#ffffff', '#1f2933', '#1f2933', 'Georgia, serif'),
 (2, 'Modern',   'Cards, sections and a colored header.',     'modern',   '#eef2f7', '#14213d', '#0e7c7b', 'Arial, sans-serif'),
 (3, 'Creative', 'Bold sidebar layout with a timeline feel.', 'creative', '#fffaf0', '#1b1b3a', '#ff6b4a', 'Verdana, sans-serif')
on conflict (id) do update set name=excluded.name, description=excluded.description,
  layout=excluded.layout, bg=excluded.bg, color=excluded.color, accent=excluded.accent, font=excluded.font;

-- 2) PORTFOLIOS table (each row belongs to a logged-in user)
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  full_name text not null,
  photo text,
  email text,
  phone text,
  address text,
  about text,
  education text,
  skills text,
  projects text,
  experience text,
  links text,
  template_id int references templates(id) default 1,
  created_at timestamptz default now()
);

-- For databases created before login was added
alter table portfolios
  add column if not exists user_id uuid references auth.users(id) on delete cascade default auth.uid();
delete from portfolios where user_id is null;   -- old test rows without an owner

-- 3) Full name must not contain numbers (checked by the database too)
alter table portfolios drop constraint if exists name_no_numbers;
alter table portfolios add constraint name_no_numbers check (full_name !~ '[0-9]') not valid;

-- 4) Access rules: each user can only see and change their own portfolios
alter table templates  enable row level security;
alter table portfolios enable row level security;

drop policy if exists "templates read" on templates;
create policy "templates read" on templates for select using (true);

drop policy if exists "portfolios all" on portfolios;
drop policy if exists "own select" on portfolios;
drop policy if exists "own insert" on portfolios;
drop policy if exists "own update" on portfolios;
drop policy if exists "own delete" on portfolios;
create policy "own select" on portfolios for select to authenticated using (auth.uid() = user_id);
create policy "own insert" on portfolios for insert to authenticated with check (auth.uid() = user_id);
create policy "own update" on portfolios for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own delete" on portfolios for delete to authenticated using (auth.uid() = user_id);
