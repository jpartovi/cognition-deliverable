import { cn } from "@/lib/utils";

export default async function Navbar({ className, ...props }: React.HTMLAttributes<HTMLElement>) {

  return (
    <nav className={cn("flex items-center space-x-4 lg:space-x-6", className)} {...props}>
      <h1 className="text-xl font-bold">
        Jude&apos;s Cognition Deliverable
      </h1>
    </nav>
  );
}