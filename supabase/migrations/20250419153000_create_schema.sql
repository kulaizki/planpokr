-- Create tables 

-- Games table to track overall game info
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  current_story TEXT DEFAULT 'No story set yet.',
  revealed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Players table to track players in each game
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  voted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table to track votes cast by players
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  value TEXT NULL, -- Can be number or special character like '?' or '∞'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);

-- Enable Row-Level Security on all tables
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to games" ON games FOR SELECT USING (true);
CREATE POLICY "Public insert access to games" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access to games" ON games FOR UPDATE USING (true);

CREATE POLICY "Public read access to players" ON players FOR SELECT USING (true);
CREATE POLICY "Public insert access to players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access to players" ON players FOR UPDATE USING (true);
CREATE POLICY "Public delete access to players" ON players FOR DELETE USING (true);

CREATE POLICY "Public read access to votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Public insert access to votes" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access to votes" ON votes FOR UPDATE USING (true);
CREATE POLICY "Public delete access to votes" ON votes FOR DELETE USING (true);

-- Create index for better query performance
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_votes_game_id ON votes(game_id);
CREATE INDEX idx_votes_player_id ON votes(player_id); 