import { useToast } from "@/components/ui/use-toast";

export const notify = (msg: string, type: "success" | "error") => {
  const toast = useToast();

  toast({
    title: type === "success" ? "Success" : "Error",
    description: msg,
    variant: type === "success" ? "default" : "destructive",
  });
};
