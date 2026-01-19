import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateFolder, useUploadFile, useUpdateItem } from "@/hooks/use-items";
import { Loader2 } from "lucide-react";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: number | null;
}

export function CreateFolderDialog({ open, onOpenChange, parentId }: CreateFolderDialogProps) {
  const [name, setName] = useState("");
  const { mutate, isPending } = useCreateFolder();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ name, parentId }, {
      onSuccess: () => {
        setName("");
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input 
              id="folder-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Projects" 
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name || isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: number;
  currentName: string;
}

export function RenameDialog({ open, onOpenChange, itemId, currentName }: RenameDialogProps) {
  const [name, setName] = useState(currentName);
  const { mutate, isPending } = useUpdateItem();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ id: itemId, name }, {
      onSuccess: () => onOpenChange(false)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Name</Label>
            <Input 
              id="item-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!name || isPending}>
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface UploadButtonProps {
  parentId: number | null;
  onUploadStart?: () => void;
  className?: string;
  children: React.ReactNode;
}

export function UploadButton({ parentId, onUploadStart, className, children }: UploadButtonProps) {
  const { mutate } = useUploadFile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadStart?.();
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      if (parentId) formData.append("parentId", parentId.toString());
      
      mutate(formData);
      // Reset input
      e.target.value = "";
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileChange}
      />
      <label htmlFor="file-upload" className="cursor-pointer block w-full h-full">
        {children}
      </label>
    </div>
  );
}
