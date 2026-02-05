-- Community follows (who follows who)
CREATE TABLE public.follows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
    CONSTRAINT follows_no_self CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view follows (public)
CREATE POLICY "Follows are viewable by everyone"
    ON public.follows
    FOR SELECT
    USING (true);

-- Users can follow
CREATE POLICY "Users can follow"
    ON public.follows
    FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow
CREATE POLICY "Users can unfollow"
    ON public.follows
    FOR DELETE
    USING (auth.uid() = follower_id);
