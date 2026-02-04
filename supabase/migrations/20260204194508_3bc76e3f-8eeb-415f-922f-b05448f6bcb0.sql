-- =============================================
-- SpotLight 2.0 - Database Schema
-- =============================================

-- 1. Create enum for game status
CREATE TYPE public.game_status AS ENUM ('wishlist', 'playing', 'completed', 'dropped');

-- 2. Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT profiles_username_unique UNIQUE (username),
    CONSTRAINT profiles_user_id_unique UNIQUE (user_id),
    CONSTRAINT profiles_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

-- 3. Create user_games table (biblioteca de jogos do usuário)
CREATE TABLE public.user_games (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    app_id INTEGER NOT NULL,
    status public.game_status NOT NULL DEFAULT 'wishlist',
    hours_played NUMERIC(10,1) DEFAULT 0,
    is_favorite BOOLEAN NOT NULL DEFAULT false,
    is_platinumed BOOLEAN NOT NULL DEFAULT false,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT user_games_unique UNIQUE (user_id, app_id)
);

-- 4. Create reviews table
CREATE TABLE public.reviews (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    app_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    is_positive BOOLEAN NOT NULL,
    hours_at_review NUMERIC(10,1) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT reviews_unique UNIQUE (user_id, app_id)
);

-- 5. Create indexes for performance
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_games_user_id ON public.user_games(user_id);
CREATE INDEX idx_user_games_app_id ON public.user_games(app_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_app_id ON public.reviews(app_id);

-- 6. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 7. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 8. Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_games_updated_at
    BEFORE UPDATE ON public.user_games
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, username, display_name)
    VALUES (
        NEW.id,
        'user_' || substr(NEW.id::text, 1, 8),
        COALESCE(NEW.raw_user_meta_data->>'display_name', 'Novo Gamer')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- RLS Policies - Profiles
-- =============================================

-- Anyone can view profiles (public profiles)
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);

-- Users can insert their own profile (backup if trigger fails)
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update only their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete only their own profile
CREATE POLICY "Users can delete their own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- RLS Policies - User Games
-- =============================================

-- Anyone can view user game libraries (public)
CREATE POLICY "User games are viewable by everyone"
    ON public.user_games
    FOR SELECT
    USING (true);

-- Users can add games to their own library
CREATE POLICY "Users can insert their own games"
    ON public.user_games
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update only their own games
CREATE POLICY "Users can update their own games"
    ON public.user_games
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete only their own games
CREATE POLICY "Users can delete their own games"
    ON public.user_games
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- RLS Policies - Reviews
-- =============================================

-- Anyone can view reviews (public)
CREATE POLICY "Reviews are viewable by everyone"
    ON public.reviews
    FOR SELECT
    USING (true);

-- Users can create their own reviews
CREATE POLICY "Users can insert their own reviews"
    ON public.reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update only their own reviews
CREATE POLICY "Users can update their own reviews"
    ON public.reviews
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete only their own reviews
CREATE POLICY "Users can delete their own reviews"
    ON public.reviews
    FOR DELETE
    USING (auth.uid() = user_id);

-- =============================================
-- Storage Bucket for Avatars
-- =============================================

-- Create avatars bucket (public for reading)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar"
    ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );