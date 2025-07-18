import { IssuesTable } from "@/components/issues-table";

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2">
          GitHub Ticket Manager
        </h1>
        <p className="text-muted-foreground">
          Manage and track your GitHub issues efficiently
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Issues</h2>
        </div>
        
        <IssuesTable />
      </div>
    </div>
  );
}
