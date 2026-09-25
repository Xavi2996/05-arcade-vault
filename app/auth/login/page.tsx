import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: PageProps<"/auth/login">) {
  // searchParams es asíncrono en Next 16: no hay variante síncrona.
  const { error } = await searchParams;
  return <LoginForm initialError={typeof error === "string" ? error : null} />;
}
