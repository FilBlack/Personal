-- Idempotent Supabase Schema for Personal Blog Site
-- This file can be run multiple times safely

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    CREATE TABLE user_profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      username TEXT NOT NULL UNIQUE,
      is_admin BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin);

-- Create blog_posts table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_posts') THEN
    CREATE TABLE blog_posts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      content TEXT NOT NULL,
      excerpt TEXT,
      featured_image_url TEXT,
      author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      published BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);

-- Create blog_post_images table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'blog_post_images') THEN
    CREATE TABLE blog_post_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      caption TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blog_post_images_post_id ON blog_post_images(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_images_order ON blog_post_images(post_id, "order");

-- Create comments table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    CREATE TABLE comments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
      author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- Create projects table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
    CREATE TABLE projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      url TEXT NOT NULL,
      image_url TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_projects_order ON projects("order");

-- Create misc_items table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'misc_items') THEN
    CREATE TABLE misc_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      media_url TEXT NOT NULL,
      media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
      caption TEXT,
      author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_misc_items_author_id ON misc_items(author_id);
CREATE INDEX IF NOT EXISTS idx_misc_items_created_at ON misc_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_misc_items_media_type ON misc_items(media_type);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE misc_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;

DROP POLICY IF EXISTS "blog_posts_select_published" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_own" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_insert_authenticated" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_update_own" ON blog_posts;
DROP POLICY IF EXISTS "blog_posts_delete_own" ON blog_posts;

DROP POLICY IF EXISTS "blog_post_images_select_all" ON blog_post_images;
DROP POLICY IF EXISTS "blog_post_images_insert_authenticated" ON blog_post_images;
DROP POLICY IF EXISTS "blog_post_images_delete_own" ON blog_post_images;

DROP POLICY IF EXISTS "comments_select_all" ON comments;
DROP POLICY IF EXISTS "comments_insert_authenticated" ON comments;
DROP POLICY IF EXISTS "comments_update_own" ON comments;
DROP POLICY IF EXISTS "comments_delete_own" ON comments;

DROP POLICY IF EXISTS "projects_select_all" ON projects;
DROP POLICY IF EXISTS "projects_insert_admin" ON projects;
DROP POLICY IF EXISTS "projects_update_admin" ON projects;
DROP POLICY IF EXISTS "projects_delete_admin" ON projects;

DROP POLICY IF EXISTS "misc_items_select_all" ON misc_items;
DROP POLICY IF EXISTS "misc_items_insert_authenticated" ON misc_items;
DROP POLICY IF EXISTS "misc_items_delete_own" ON misc_items;

-- User Profiles Policies
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "user_profiles_select_all" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "user_profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Blog Posts Policies
CREATE POLICY "blog_posts_select_published" ON blog_posts
  FOR SELECT USING (published = true);

CREATE POLICY "blog_posts_select_own" ON blog_posts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "blog_posts_insert_authenticated" ON blog_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "blog_posts_update_own" ON blog_posts
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "blog_posts_delete_own" ON blog_posts
  FOR DELETE USING (auth.uid() = author_id);

-- Blog Post Images Policies
CREATE POLICY "blog_post_images_select_all" ON blog_post_images
  FOR SELECT USING (true);

CREATE POLICY "blog_post_images_insert_authenticated" ON blog_post_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM blog_posts 
      WHERE blog_posts.id = blog_post_images.post_id 
      AND blog_posts.author_id = auth.uid()
    )
  );

CREATE POLICY "blog_post_images_delete_own" ON blog_post_images
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM blog_posts 
      WHERE blog_posts.id = blog_post_images.post_id 
      AND blog_posts.author_id = auth.uid()
    )
  );

-- Comments Policies
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT USING (true);

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE USING (auth.uid() = author_id);

-- Projects Policies
CREATE POLICY "projects_select_all" ON projects
  FOR SELECT USING (true);

CREATE POLICY "projects_insert_admin" ON projects
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "projects_update_admin" ON projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "projects_delete_admin" ON projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

-- Misc Items Policies
CREATE POLICY "misc_items_select_all" ON misc_items
  FOR SELECT USING (true);

CREATE POLICY "misc_items_insert_authenticated" ON misc_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "misc_items_delete_own" ON misc_items
  FOR DELETE USING (auth.uid() = author_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for blog_posts updated_at
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

