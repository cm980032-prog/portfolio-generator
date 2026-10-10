-- Run this whole file in Supabase > SQL Editor

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

-- 2) PORTFOLIOS table
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
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

-- 3) Access rules (class project: public access with the anon key)
alter table templates  enable row level security;
alter table portfolios enable row level security;

drop policy if exists "templates read" on templates;
create policy "templates read" on templates for select using (true);

drop policy if exists "portfolios all" on portfolios;
create policy "portfolios all" on portfolios for all using (true) with check (true);
