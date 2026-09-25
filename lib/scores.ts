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
  // Nulo a propósito cuando se juega como invitado: la política
  // "guests insert anonymous scores" solo acepta filas sin dueño, y la de
  // usuario exige que el user_id sea el suyo.
  userId: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("scores")
    .insert({
      game_id: gameId,
      player_name: playerName,
      score,
      user_id: userId,
    });
  if (error) throw error;
}

export interface UserBestScore {
  gameId: string;
  gameTitle: string;
  score: number;
  date: string;
}

/**
 * La mejor marca del usuario en cada juego, para /cuenta. Se pide ordenado por
 * puntuación y se queda con la primera fila de cada juego: Postgres no tiene
 * distinct on a través de PostgREST y el volumen por usuario es pequeño.
 */
export async function getBestScoresByUser(
  userId: string,
): Promise<UserBestScore[]> {
  const { data, error } = await supabase
    .from("scores")
    .select("game_id, score, created_at, games(title)")
    .eq("user_id", userId)
    .order("score", { ascending: false });
  if (error) throw error;

  const best = new Map<string, UserBestScore>();
  for (const row of data as unknown as {
    game_id: string;
    score: number;
    created_at: string;
    games: { title: string } | null;
  }[]) {
    if (best.has(row.game_id)) continue;
    best.set(row.game_id, {
      gameId: row.game_id,
      gameTitle: row.games?.title ?? row.game_id.toUpperCase(),
      score: row.score,
      date: formatDate(row.created_at),
    });
  }
  return [...best.values()];
}
