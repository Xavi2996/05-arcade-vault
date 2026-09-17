import { notFound } from "next/navigation";
import GamePlayer from "@/components/GamePlayer";
import { getGameById } from "@/lib/games";

export default async function GamePlayerPage({
  params,
}: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = await getGameById(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
