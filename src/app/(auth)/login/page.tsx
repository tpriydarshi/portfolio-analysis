import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign In | Portfolio X-Ray",
};

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#f7f8f8] mb-1">
        Welcome back
      </h2>
      <p className="text-sm text-[#8a8f98] mb-6">
        Sign in to your account to continue
      </p>
      <LoginForm />
    </div>
  );
}
