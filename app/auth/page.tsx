import { redirect } from "next/navigation";

// /auth dejó de ser una pantalla con pestañas: el callback de OAuth y la
// elección de nick necesitan rutas propias. La entrada sigue existiendo por
// los enlaces antiguos.
export default function AuthPage() {
  redirect("/auth/login");
}
