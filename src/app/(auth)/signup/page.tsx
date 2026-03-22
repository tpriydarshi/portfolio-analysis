import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = {
  title: "Sign Up | Portfolio X-Ray",
};

export default function SignupPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-[#e7e5e5] mb-1">
        Create your account
      </h2>
      <p className="text-sm text-[#9f9da1] mb-6">
        Start analyzing your mutual fund portfolio
      </p>
      <SignupForm />
    </div>
  );
}
