-- Create games table
CREATE TABLE IF NOT EXISTS public.games (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    current_story TEXT DEFAULT 'No story set yet.' NOT NULL,
    revealed BOOLEAN DEFAULT false NOT NULL
);

-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
    id TEXT PRIMARY KEY,
    game_id TEXT REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    voted BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    game_id TEXT REFERENCES public.games(id) ON DELETE CASCADE NOT NULL,
    player_id TEXT REFERENCES public.players(id) ON DELETE CASCADE NOT NULL,
    value TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (game_id, player_id)
);

-- Enable row level security
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (suitable for this app's use case)
CREATE POLICY "Public read access to games" ON public.games FOR SELECT USING (true);
CREATE POLICY "Public insert access to games" ON public.games FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access to games" ON public.games FOR UPDATE USING (true);

CREATE POLICY "Public read access to players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Public insert access to players" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access to players" ON public.players FOR UPDATE USING (true);
CREATE POLICY "Public delete access to players" ON public.players FOR DELETE USING (true);

CREATE POLICY "Public read access to votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Public insert access to votes" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access to votes" ON public.votes FOR UPDATE USING (true);
CREATE POLICY "Public delete access to votes" ON public.votes FOR DELETE USING (true);

-- Enable realtime for the tables through publications
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE games, players, votes; 