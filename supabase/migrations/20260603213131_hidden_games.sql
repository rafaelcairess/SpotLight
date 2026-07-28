ALTER TABLE user_games ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_user_games_hidden ON user_games(user_id, is_hidden);;
