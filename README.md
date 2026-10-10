# Portfolio Generator (simple version)

**Technologies:** HTML, CSS, JavaScript, Supabase JS client
**Database:** Supabase (PostgreSQL) – tables `templates` and `portfolios`
**Hosting:** Netlify / Vercel / GitHub Pages
**Published URL:** _add your link_

## Setup
1. Create a Supabase project. In **SQL Editor**, run `supabase/setup.sql`. This creates both tables and inserts the 3 templates (Simple, Modern, Creative).
2. In `index.html`, paste your Project URL and **anon public** key (Project Settings > API). Never submit secret keys.
3. Run locally with the VS Code **Live Server** extension, or deploy by dragging the folder to app.netlify.com/drop.

## Database structure
**templates:** id, name, description, layout (simple/modern/creative), bg, color, accent, font
**portfolios:** id, full_name, photo, email, phone, address, about, education, skills, projects, experience, links, template_id (references templates.id), created_at

## How templates work
The app loads the rows from `templates` and draws each portfolio with that row's layout, colors and font. Choosing a template saves `template_id` on the portfolio.

## Screenshots
_Add screenshots of the system and the 3 templates here._
