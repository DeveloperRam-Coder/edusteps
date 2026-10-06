import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/ui/primitives/shadcn';
import { Button } from '@/ui/primitives/shadcn';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
    isLoading: boolean;
}

export default function DeleteAccountModal({
    isOpen,
    onConfirm,
    onCancel,
    isLoading
}: DeleteAccountModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onCancel}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <DialogTitle className="text-center text-xl font-bold text-gray-900">
                        Delete Account
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-500 pt-2">
                        Are you sure you want to delete your account? This action is irreversible and all your data will be permanently removed.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-3 mt-6">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Account'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
