import { getGames } from "@/lib/games";
import { getTopScores, type ScoreRow } from "@/lib/scores";
import SalonDeLaFamaClient from "@/components/SalonDeLaFamaClient";

export const dynamic = "force-dynamic";

export default async function HallOfFamePage() {
  const games = await getGames();
  const entries = await Promise.all(
    games.map(async (g) => [g.id, await getTopScores(g.id, 12)] as const),
  );
  const scoresByGame: Record<string, ScoreRow[]> = Object.fromEntries(entries);

  return <SalonDeLaFamaClient games={games} scoresByGame={scoresByGame} />;
}
