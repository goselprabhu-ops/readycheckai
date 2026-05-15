import { toast } from "sonner";

/**
 * Centralized toast helpers. Feature code should import `notify` from here
 * instead of importing `sonner` directly. This lets us swap providers or
 * add analytics later without touching every call site.
 */
export const notify = {
  success: (message: string, description?: string) =>
    toast.success(message, description ? { description } : undefined),
  error: (message: string, description?: string) =>
    toast.error(message, description ? { description } : undefined),
  info: (message: string, description?: string) =>
    toast(message, description ? { description } : undefined),
  promise: toast.promise,
};