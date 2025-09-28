import Navigation from '../Navigation';
import { SidebarProvider } from "@/components/ui/sidebar";

export default function NavigationExample() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Navigation />
        <main className="flex-1 p-8">
          <h2 className="text-2xl font-bold">Main Content Area</h2>
          <p className="text-muted-foreground">Navigation sidebar example</p>
        </main>
      </div>
    </SidebarProvider>
  );
}