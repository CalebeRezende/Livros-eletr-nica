import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <p className="text-slate-600">
        O acesso é feito exclusivamente com sua conta Google.
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: callbackUrl ?? "/" });
        }}
      >
        <button
          type="submit"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium hover:bg-slate-50"
        >
          Entrar com Google
        </button>
      </form>
    </main>
  );
}
