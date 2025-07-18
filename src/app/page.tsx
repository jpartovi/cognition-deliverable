import { IssuesTable } from "@/components/issues-table";

export default function Home() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold mb-2">GitHub Issue Manager</h1>
        <p className="text-muted-foreground">Manage and track your GitHub issues efficiently</p>
      </header>
      <section>
        <IssuesTable />
      </section>
    </div>
  );
}
