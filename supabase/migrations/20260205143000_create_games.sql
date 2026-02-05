-- =============================================
-- SpotLight - Games Catalog
-- =============================================

CREATE TABLE public.games (
    app_id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    image TEXT,
    short_description TEXT,
    genre TEXT,
    tags TEXT[],
    active_players INTEGER,
    community_rating INTEGER,
    price TEXT,
    release_date TEXT,
    developer TEXT,
    publisher TEXT,
    platforms TEXT[],
    steam_url TEXT,
    last_synced TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_games_title ON public.games USING GIN (to_tsvector('simple', title));
CREATE INDEX idx_games_active_players ON public.games(active_players DESC);
CREATE INDEX idx_games_community_rating ON public.games(community_rating DESC);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Games are viewable by everyone"
    ON public.games
    FOR SELECT
    USING (true);
