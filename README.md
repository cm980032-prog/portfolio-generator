# Portfolio Generator

## Project Title
Online Portfolio Template Generator

## Project Description
A website where a user creates an account, enters their portfolio information, saves it to an online database, chooses 1 of 3 templates (Simple, Modern, Creative), previews the generated portfolio, and can edit or delete it later. Each portfolio is private to the account that created it.

## Published Website URL
https://cm980032-prog.github.io/portfolio-generator/

## Technologies Used
- HTML, CSS and JavaScript (no framework, no build step)
- Supabase JavaScript client (loaded from a CDN)

## Database Platform
- **Database:** Supabase (PostgreSQL)
- **Database Project:** portfolio-generator
- **Authentication:** Supabase Auth (email and password)

## Hosting / Deployment Platform
GitHub Pages

## Features
- Sign up, log in and log out
- Portfolio form: full name, profile picture, email, contact number, address, about me, education, skills, projects, work experience, social media / website links
- Full name accepts letters only. Numbers are blocked in the form and in the database.
- 3 templates stored in the database: Simple, Modern, Creative
- Template selection page with live previews, then the portfolio preview page
- Manage page: view, edit and delete (only your own portfolios)
- Responsive layout

## System Flow
Home > Sign up / Log in > Create Portfolio > Enter information > Save to online database > Select 1 of 3 templates > Preview portfolio > Edit / Delete

## Database Structure
**templates**
| Column | Type | Notes |
|---|---|---|
| id | int | primary key (1, 2, 3) |
| name | text | Simple, Modern, Creative |
| description | text | |
| layout | text | simple / modern / creative |
| bg, color, accent, font | text | colors and font used by the template |

**portfolios**
| Column | Type | Notes |
|---|---|---|
| id | uuid | primary key |
| user_id | uuid | owner, references auth.users |
| full_name | text | required, no numbers (check constraint) |
| photo | text | resized image stored as a data URL |
| email, phone, address, about | text | |
| education, skills, projects, experience, links | text | one entry per line |
| template_id | int | references templates.id |
| created_at | timestamptz | |

**Security:** row-level security is on. A logged-in user can only read, edit and delete rows where `user_id` is their own id. Templates are readable by everyone. Only the public (publishable) key is used in the website. No passwords or secret keys are in the code.

## Files
| File | Purpose |
|---|---|
| index.html | Page shell and Supabase URL and public key |
| app.js | Pages, login, templates, add / edit / delete |
| style.css | Styles for the website and the 3 templates |
| supabase/setup.sql | Creates the tables, the 3 templates and the security rules |

## Setup
1. Create a Supabase project. Open **SQL Editor**, paste `supabase/setup.sql`, and click **Run**.
2. In Supabase go to **Authentication > Sign In / Providers > Email** and turn off **Confirm email** (easier testing).
3. In `index.html`, set your Project URL and publishable key.
4. Run locally with the VS Code **Live Server** extension.
5. Publish: upload the files to a GitHub repository, then **Settings > Pages > Deploy from a branch > main > / (root)**.

## Screenshots
_Add screenshots here: Home, Sign up / Log in, Form, Template selection, Preview, Manage, the 3 templates, and the Supabase Table Editor._
