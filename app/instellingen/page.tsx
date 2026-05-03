import { AppShell } from "@/app/components/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireHousehold } from "@/lib/household";

export default async function SettingsPage() {
  const { household, session } = await requireHousehold();
  const user = session.user;

  return (
    <AppShell active="instellingen" userName={user?.name}>
      <main className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
        <div>
          <p className="text-sm text-muted-foreground">Account</p>
          <h1 className="text-2xl font-semibold tracking-tight">Instellingen</h1>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Gebruiker</CardTitle>
              <CardDescription>{user?.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{user?.name ?? "Onbekend"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Huishouden</CardTitle>
              <CardDescription>Standaard profielen: Robin en Amber.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{household.name}</p>
            </CardContent>
          </Card>
        </section>
      </main>
    </AppShell>
  );
}
