import { LoginForm } from "@/components/auth/login-form";
import { redirectIfAuthenticated } from "@/lib/server/auth";

export default async function LoginPage() {
  await redirectIfAuthenticated();
  return <LoginForm defaultRedirect="/select-company" />;
}
