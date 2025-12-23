import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function DeleteActionDialog() {
  return (
    <Dialog>
      <DialogTrigger>Delete</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure to delete this?</DialogTitle>
          <DialogDescription>This action cannot be undone. This will permanently delete your data.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
