import { Dumbbell } from "lucide-react";
import { Button, Card, Field, inputClass } from "../../components/ui";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-primary text-white">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Sign in</h1>
            <p className="text-sm text-muted">Login is required before workout data syncs to Supabase.</p>
          </div>
        </div>
        <form className="grid gap-4">
          <Field label="Email address">
            <input className={inputClass} type="email" placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <input className={inputClass} type="password" placeholder="Your password" />
          </Field>
          <Button variant="primary" type="button">Continue in local demo mode</Button>
          <p className="text-sm text-muted">Supabase Auth hooks are scaffolded. Add your `.env.local` values when your Supabase project is ready.</p>
        </form>
      </Card>
    </main>
  );
}
