import { supabase } from "@/lib/supabase";

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}`;
}

export async function getTopScores(
  gameId: string,
  limit: number,
): Promise<ScoreRow[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data.map((row, i) => ({
    rank: i + 1,
    name: row.player_name,
    score: row.score,
    date: formatDate(row.created_at),
  }));
}

export async function getBestScoreByName(
  gameId: string,
  name: string,
): Promise<ScoreRow | null> {
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false });
  if (error) throw error;
  const needle = name.trim().toLowerCase();
  const row = data.find((r) => r.player_name.trim().toLowerCase() === needle);
  if (!row) return null;
  return {
    rank: data.indexOf(row) + 1,
    name: row.player_name,
    score: row.score,
    date: formatDate(row.created_at),
  };
}

export async function saveScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<void> {
  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, player_name: playerName, score });
  if (error) throw error;
}
