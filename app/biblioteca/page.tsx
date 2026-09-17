import { getGames } from "@/lib/games";
import BibliotecaClient from "@/components/BibliotecaClient";

export const dynamic = "force-dynamic";

export default async function BibliotecaPage() {
  const games = await getGames();
  return <BibliotecaClient games={games} />;
}
