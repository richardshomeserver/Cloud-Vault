import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { Layout } from "@/components/layout";
import { useItems, useBreadcrumb, useUpdateItem, useDeleteItem } from "@/hooks/use-items";
import { FileCard } from "@/components/file-card";
import { CreateFolderDialog, UploadButton, RenameDialog } from "@/components/create-dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List as ListIcon, 
  ChevronRight, 
  Home, 
  Upload, 
  FolderPlus,
  ArrowLeft
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

// Helper to parse query string
const useQueryParams = () => {
  const search = useSearch();
  const params = new URLSearchParams(search);
  return {
    folderId: params.get("folder") ? Number(params.get("folder")) : undefined,
    view: params.get("view") as "grid" | "list" || "grid",
  };
};

interface DashboardProps {
  category?: "all" | "recent" | "starred" | "trash";
}

export default function Dashboard({ category = "all" }: DashboardProps) {
  const [location, setLocation] = useLocation();
  const { folderId, view } = useQueryParams();
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for dialogs
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{id: number, name: string} | null>(null);

  // Data fetching
  const { data: items, isLoading } = useItems({ 
    parentId: category === "all" ? (folderId ? String(folderId) : "root") : undefined,
    category,
    search: searchQuery || undefined
  });
  
  const { data: breadcrumb } = useBreadcrumb(folderId);
  const { mutate: updateItem } = useUpdateItem();
  const { mutate: deleteItem } = useDeleteItem();

  const handleNavigate = (newFolderId?: number) => {
    if (newFolderId) {
      setLocation(`/drive?folder=${newFolderId}&view=${view}`);
    } else {
      setLocation(`/drive?view=${view}`);
    }
  };

  const setViewMode = (newView: "grid" | "list") => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", newView);
    setLocation(`${window.location.pathname}?${params.toString()}`);
  };

  // Group items by type (Folders first)
  const folders = items?.filter(i => i.type === "folder") || [];
  const files = items?.filter(i => i.type === "file") || [];

  const pageTitle = {
    all: "My Cloud",
    recent: "Recent Files",
    starred: "Starred",
    trash: "Trash"
  }[category];

  return (
    <Layout>
      <div className="h-full flex flex-col p-6 max-w-7xl mx-auto w-full">
        {/* Top Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search files and folders..." 
                className="pl-10 bg-background border-transparent shadow-sm focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/5 transition-all rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-background rounded-lg border border-border/50 p-1 flex shadow-sm">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 rounded-md ${view === "grid" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 rounded-md ${view === "list" ? "bg-muted text-foreground" : "text-muted-foreground"}`}
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>

            {category === "all" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="rounded-xl px-4 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                    <Plus className="w-5 h-5 mr-2" />
                    New
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                  <DropdownMenuItem 
                    className="rounded-lg py-2 cursor-pointer" 
                    onClick={() => setIsCreateFolderOpen(true)}
                  >
                    <FolderPlus className="w-4 h-4 mr-2 text-blue-500" />
                    New Folder
                  </DropdownMenuItem>
                  <UploadButton parentId={folderId || null} className="w-full">
                    <DropdownMenuItem className="rounded-lg py-2 cursor-pointer w-full" onSelect={(e) => e.preventDefault()}>
                      <Upload className="w-4 h-4 mr-2 text-purple-500" />
                      Upload File
                    </DropdownMenuItem>
                  </UploadButton>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground overflow-x-auto pb-2 scrollbar-none">
          {category === "all" ? (
            <>
              {folderId && (
                <Button variant="ghost" size="icon" className="h-8 w-8 mr-1 -ml-2" onClick={() => window.history.back()}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div 
                className={`flex items-center gap-1 hover:text-foreground cursor-pointer transition-colors ${!folderId ? "font-semibold text-foreground" : ""}`}
                onClick={() => handleNavigate(undefined)}
              >
                <Home className="w-4 h-4" />
                <span>My Cloud</span>
              </div>
              {breadcrumb?.map((item) => (
                <div key={item.id} className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                  <span 
                    className={`hover:text-foreground cursor-pointer transition-colors ${item.id === folderId ? "font-semibold text-foreground" : ""}`}
                    onClick={() => handleNavigate(item.id)}
                  >
                    {item.name}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <h2 className="text-xl font-display font-bold text-foreground">{pageTitle}</h2>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />
              ))}
            </div>
          ) : items?.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl bg-muted/20">
              <div className="p-4 bg-background rounded-full mb-4 shadow-sm">
                <FolderPlus className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium">No items found</p>
              <p className="text-sm">Drag and drop files here to upload</p>
            </div>
          ) : (
            <div className="space-y-8 pb-12">
              {folders.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-1">Folders</h3>
                  <div className={view === "grid" ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "flex flex-col gap-2"}>
                    {folders.map((item) => (
                      <FileCard 
                        key={item.id} 
                        item={item} 
                        viewMode={view}
                        onClick={() => handleNavigate(item.id)}
                        onRename={() => setEditingItem({ id: item.id, name: item.name })}
                        onToggleStar={() => updateItem({ id: item.id, isStarred: !item.isStarred })}
                        onToggleTrash={() => updateItem({ id: item.id, isTrashed: !item.isTrashed })}
                        onDelete={() => deleteItem(item.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {files.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-4 px-1">Files</h3>
                  <div className={view === "grid" ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4" : "flex flex-col gap-2"}>
                    {files.map((item) => (
                      <FileCard 
                        key={item.id} 
                        item={item} 
                        viewMode={view}
                        // onClick={() => window.open(item.url, '_blank')} // In real app, open preview
                        onRename={() => setEditingItem({ id: item.id, name: item.name })}
                        onToggleStar={() => updateItem({ id: item.id, isStarred: !item.isStarred })}
                        onToggleTrash={() => updateItem({ id: item.id, isTrashed: !item.isTrashed })}
                        onDelete={() => deleteItem(item.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog 
        open={isCreateFolderOpen} 
        onOpenChange={setIsCreateFolderOpen} 
        parentId={folderId || null} 
      />
      
      {editingItem && (
        <RenameDialog
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          itemId={editingItem.id}
          currentName={editingItem.name}
        />
      )}
    </Layout>
  );
}
