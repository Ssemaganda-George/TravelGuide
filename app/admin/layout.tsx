import Link from "next/link";
import { authClient } from "@/lib/supabase/server";
import { NotificationHandler } from "@/components/NotificationWrapper";
import { AdminAppSidebar } from "@/components/admin/app-sidebar";
import { signOut } from "@/app/admin/actions";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = await authClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return children;

  return (
    <div data-admin-shell>
      <TooltipProvider>
        <SidebarProvider>
          <AdminAppSidebar userEmail={user.email} signOutAction={signOut} />
          <SidebarInset className="min-w-0 overflow-x-hidden">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Admin</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <div className="ml-auto">
                <Button asChild variant="outline" size="sm">
                  <Link href="/">View site</Link>
                </Button>
              </div>
            </header>
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 md:p-6">
              <NotificationHandler>{children}</NotificationHandler>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}
