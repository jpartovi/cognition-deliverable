import { IssuesTable } from "@/components/issues-table";

export default function Home() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <header>
        <h1 className="text-4xl font-extrabold mb-2">GitHub Issue Manager</h1>
        <p className="text-muted-foreground">Manage and track your GitHub issues efficiently</p>
      </header>
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Issues</h2>
        </div>
        <IssuesTable />
      </section>
    </div>
  );
}
