"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Handshake,
  LogOut,
  MessageSquareText,
  Share2,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SITE_NAME } from "@/lib/site";

const NAV = [
  { href: "/admin", label: "Enquiries", icon: ClipboardList },
  { href: "/admin/referrals", label: "Referrals", icon: Share2 },
  { href: "/admin/partners", label: "Partners", icon: Handshake },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/insights", label: "Insights", icon: BarChart3 },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareText },
] as const;

export function AdminAppSidebar({
  userEmail,
  signOutAction,
}: {
  userEmail?: string | null;
  signOutAction: (fd: FormData) => Promise<void>;
}) {
  const pathname = usePathname() || "/admin";
  const initials = (userEmail ?? "A")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/admin" aria-label={`${SITE_NAME} admin home`} />}>
              <span className="relative hidden size-8 shrink-0 overflow-hidden rounded-md group-data-[collapsible=icon]:block">
                <Image src="/logo/logo1.png" alt="" width={102} height={32} className="h-8 w-auto max-w-none" priority />
              </span>
              <div className="min-w-0 flex-1 text-left">
                <Image src="/logo/logo1.png" alt={SITE_NAME} width={160} height={50} className="h-9 w-auto max-w-full object-contain object-left" priority />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operations</SidebarGroupLabel>
          <SidebarMenu>
            {NAV.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={active}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Admin</span>
                <span className="text-muted-foreground block min-w-0 truncate text-xs" title={userEmail ?? undefined}>
                  {userEmail ?? "Signed in"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOutAction} className="w-full px-2 pb-2">
              <Button type="submit" variant="outline" size="sm" className="w-full justify-start gap-2">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
