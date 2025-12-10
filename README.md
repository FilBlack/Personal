# Personal Blog Site

A clean, modern personal blog site built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Blog Posts**: Create and manage blog posts with markdown support
- **Image Insertion**: Insert images between text sections in blog posts
- **Nested Comments**: Comment system with nested replies
- **About Page**: Showcase personal projects with cards
- **Misc Page**: Masonry layout for photos and videos
- **Super User Authentication**: Database-based admin access control
- **Clean Design**: White background with black text, modern and minimal

## Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database and authentication
- **react-markdown** - Markdown rendering

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Copy your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database

1. Open the Supabase SQL Editor
2. Copy and paste the entire contents of `guides/supabase-schema.sql`
3. Run the SQL script (it's idempotent, safe to run multiple times)

### 4. Create Your Super User

After registering your first account, run this SQL in Supabase to make yourself a super user:

```sql
UPDATE user_profiles
SET is_admin = true
WHERE username = 'your_username';
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating Blog Posts

1. Log in as a super user
2. Click "New Post" in the navbar
3. Fill in the title, content, and optional excerpt/featured image
4. Use `[IMAGE]` on its own line in the content to insert images
5. Click "Add Image" to add images that will be inserted at `[IMAGE]` markers
6. Click "Publish Post"

### Adding Projects

Run this SQL in Supabase to add projects to your About page:

```sql
INSERT INTO projects (title, description, url, image_url, "order")
VALUES 
  ('Project Name', 'Project description', 'https://project-url.com', 'https://image-url.com', 0),
  ('Another Project', 'Another description', 'https://another-url.com', NULL, 1);
```

### Adding Misc Items

1. Log in as a super user
2. Go to the Misc page
3. Click "Add Item"
4. Enter media URL, select type (image/video), and optional caption
5. Click "Upload"

## Project Structure

```
Personal/site/
├── app/
│   ├── about/          # About page with projects
│   ├── blog/           # Blog pages
│   │   ├── [slug]/     # Individual blog post
│   │   ├── edit/       # Edit blog post (super user)
│   │   ├── new/        # Create blog post (super user)
│   │   └── page.tsx    # Blog list
│   ├── login/          # Login page
│   ├── misc/           # Misc page with masonry layout
│   ├── register/       # Registration page
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/
│   ├── BlogPostCard.tsx    # Blog post preview card
│   ├── CommentForm.tsx     # Comment form component
│   ├── CommentTree.tsx     # Nested comment tree
│   ├── EditButton.tsx      # Edit button for posts
│   ├── Footer.tsx          # Footer with social links
│   ├── Navbar.tsx          # Navigation bar
│   └── ProjectCard.tsx     # Project card component
├── hooks/
│   └── useAuth.ts          # Authentication hook
├── lib/
│   └── supabase/           # Supabase clients
├── utils/
│   ├── formatDate.ts       # Date formatting
│   └── markdown.tsx        # Markdown renderer
└── guides/
    └── supabase-schema.sql # Database schema (idempotent)
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

The site will automatically deploy on every push to the main branch.

## Customization

### Footer Links

Edit `components/Footer.tsx` to update LinkedIn, GitHub, and Email links.

### Styling

The site uses Tailwind CSS with a white/black theme. Modify `app/globals.css` for global styles.

### About Page Content

Edit `app/about/page.tsx` to customize the hero section text.

## License

MIT
