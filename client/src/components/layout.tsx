import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useLogout } from "@/hooks/use-auth";
import { 
  Cloud, 
  Clock, 
  Star, 
  Trash2, 
  LogOut, 
  Menu, 
  X,
  HardDrive
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: user } = useUser();
  const { mutate: logout } = useLogout();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simple quota calculation (mock usage)
  const usedStorage = 2.4 * 1024 * 1024 * 1024; // 2.4 GB used
  const totalStorage = Number(user?.storageQuota || 10737418240);
  const usagePercentage = (usedStorage / totalStorage) * 100;

  const navItems = [
    { label: "My Cloud", icon: Cloud, path: "/drive" },
    { label: "Recent", icon: Clock, path: "/recent" },
    { label: "Starred", icon: Star, path: "/starred" },
    { label: "Trash", icon: Trash2, path: "/trash" },
  ];

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-6 py-8">
        <div className="bg-primary rounded-xl p-2.5 shadow-lg shadow-primary/25">
          <Cloud className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-xl font-display font-bold text-foreground">CloudVault</h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.path || (item.path === "/drive" && location === "/");
          return (
            <Link key={item.path} href={item.path}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer",
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto">
        <div className="bg-muted/50 rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-foreground">
            <HardDrive className="w-4 h-4 text-primary" />
            Storage
          </div>
          <Progress value={usagePercentage} className="h-2 mb-2 bg-muted-foreground/10" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>2.4 GB used</span>
            <span>10 GB total</span>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-xs">
              {user?.username?.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate text-foreground">{user?.displayName || user?.username}</p>
              <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-card/50 backdrop-blur-sm z-20">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-background shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="absolute top-4 right-4">
              <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-muted/20 relative">
        <div className="lg:hidden p-4 flex items-center gap-4 bg-background border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <span className="font-display font-bold text-lg">CloudVault</span>
        </div>
        
        {children}
      </main>
    </div>
  );
}
