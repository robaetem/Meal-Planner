import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signInWithGoogle, signInWithMicrosoft } from "../actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SignInPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  if (session?.user?.email) redirect("/");

  const params = await searchParams;
  const hasAccessError = params?.error === "AccessDenied";

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8">
      <Card className="w-full max-w-md" aria-labelledby="signin-title">
        <CardHeader>
          <CardTitle id="signin-title">Meal Planner</CardTitle>
          <CardDescription>
            Meld je aan met een goedgekeurd Google- of Microsoft-account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <form action={signInWithGoogle}>
            <Button className="w-full" type="submit" variant="outline">
              Verder met Google
            </Button>
          </form>
          <form action={signInWithMicrosoft}>
            <Button className="w-full" type="submit" variant="outline">
              Verder met Microsoft
            </Button>
          </form>

        {hasAccessError ? (
          <p className="text-sm text-destructive">
            Dit account heeft geen toegang tot Meal Planner.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Toegelaten accounts: robin.baeteman@gmail.com en
            robin.baeteman@outlook.com.
          </p>
        )}
        </CardContent>
      </Card>
    </main>
  );
}
