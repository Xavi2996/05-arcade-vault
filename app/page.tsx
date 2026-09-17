import { getGames } from "@/lib/games";
import HomeClient from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function Home() {
  const games = await getGames();
  return <HomeClient games={games} />;
}
