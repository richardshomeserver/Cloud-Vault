import { Item } from "@shared/schema";
import { Folder, FileText, Image, File, MoreVertical, Star, Trash2, Download, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface FileCardProps {
  item: Item;
  viewMode: "grid" | "list";
  onClick?: () => void;
  onRename?: () => void;
  onToggleStar?: () => void;
  onToggleTrash?: () => void;
  onDelete?: () => void; // Permanent delete
}

export function FileCard({ item, viewMode, onClick, onRename, onToggleStar, onToggleTrash, onDelete }: FileCardProps) {
  const Icon = item.type === "folder" ? Folder : 
               item.mimeType?.startsWith("image/") ? Image :
               item.mimeType === "application/pdf" ? FileText : File;

  const iconColor = item.type === "folder" ? "text-blue-500 fill-blue-500/20" : 
                    item.mimeType?.startsWith("image/") ? "text-purple-500" :
                    "text-gray-500";

  if (viewMode === "list") {
    return (
      <div 
        onClick={onClick}
        className="group flex items-center gap-4 p-3 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-border/50 transition-all cursor-pointer"
      >
        <div className={cn("p-2 rounded-lg bg-muted", item.type === "folder" ? "bg-blue-50" : "")}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
          <div className="col-span-6 font-medium text-sm truncate text-foreground">{item.name}</div>
          <div className="col-span-3 text-xs text-muted-foreground hidden sm:block">
            {item.size ? (item.size / 1024 / 1024).toFixed(2) + " MB" : "--"}
          </div>
          <div className="col-span-3 text-xs text-muted-foreground hidden md:block">
            {formatDistanceToNow(new Date(item.updatedAt || new Date()), { addSuffix: true })}
          </div>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.isStarred && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-2" />}
          
          <ItemActions 
            item={item} 
            onRename={onRename} 
            onToggleStar={onToggleStar}
            onToggleTrash={onToggleTrash}
            onDelete={onDelete}
          />
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className="group relative bg-card rounded-2xl border border-border/50 p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col aspect-[4/3]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl bg-muted/50", item.type === "folder" ? "bg-blue-50" : "")}>
          <Icon className={cn("w-8 h-8", iconColor)} />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
           <ItemActions 
            item={item} 
            onRename={onRename} 
            onToggleStar={onToggleStar}
            onToggleTrash={onToggleTrash}
            onDelete={onDelete}
          />
        </div>
      </div>
      
      <div className="mt-auto">
        <h3 className="font-medium text-sm truncate text-foreground mb-1 pr-6" title={item.name}>
          {item.name}
        </h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{item.type === "folder" ? "Folder" : (item.size ? (item.size / 1024 / 1024).toFixed(1) + " MB" : "0 KB")}</span>
          {item.isStarred && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
        </div>
      </div>
    </div>
  );
}

function ItemActions({ 
  item, 
  onRename, 
  onToggleStar, 
  onToggleTrash, 
  onDelete 
}: Omit<FileCardProps, "viewMode" | "onClick">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename?.(); }}>
          <Pencil className="w-4 h-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleStar?.(); }}>
          <Star className={cn("w-4 h-4 mr-2", item.isStarred ? "fill-yellow-400 text-yellow-400" : "")} />
          {item.isStarred ? "Remove Star" : "Add to Starred"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
          <Download className="w-4 h-4 mr-2" />
          Download
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {item.isTrashed ? (
           <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(); }} className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Forever
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggleTrash?.(); }} className="text-destructive focus:text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Move to Trash
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
