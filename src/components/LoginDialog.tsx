import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader as Loader2 } from "lucide-react";
import { useAsyncAction } from "@/hooks/use-async";
import { authSchema, type AuthFormData } from "@/schemas";
import { maskPhone } from "@/utils/phone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [formData, setFormData] = useState<AuthFormData>({
    phone: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<Partial<AuthFormData>>({});
  const { loading, error, execute } = useAsyncAction();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = (): boolean => {
    try {
      authSchema.parse(formData);
      setValidationErrors({});
      return true;
    } catch (error: unknown) {
      const errors: Partial<AuthFormData> = {};
      if (error && typeof error === 'object' && 'errors' in error) {
        const zodError = error as { errors: Array<{ path: string[]; message: string }> };
        zodError.errors?.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as keyof AuthFormData] = err.message;
          }
        });
      }
      setValidationErrors(errors);
      return false;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const success = await execute(async () => {
      const cleanPhone = formData.phone.replace(/\D/g, "");
      const email = `${cleanPhone}@confraria.local`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Telefone ou senha incorretos.");
        } else {
          throw new Error(error.message);
        }
      }
    });

    if (success) {
      onOpenChange(false);
      navigate("/dashboard");
    } else if (error) {
      toast({
        title: "Erro ao fazer login",
        description: error,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <img
              src="/logo-confraria.png"
              alt="Confraria Pedra Branca"
              className="h-20 w-auto"
            />
          </div>
          <DialogTitle className="text-2xl font-display tracking-wide text-center">
            CONFRARIA PEDRA BRANCA
          </DialogTitle>
          <DialogDescription className="font-serif text-center">
            Sistema de Gestão de Consórcios
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleLogin} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="phone" className="font-sans text-sm font-medium">
              Telefone
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
              disabled={loading}
              className={`font-sans ${validationErrors.phone ? "border-destructive" : ""}`}
              maxLength={15}
            />
            {validationErrors.phone && (
              <p className="text-sm text-destructive font-sans">{validationErrors.phone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-sans text-sm font-medium">
              Senha
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              disabled={loading}
              className={`font-sans ${validationErrors.password ? "border-destructive" : ""}`}
            />
            {validationErrors.password && (
              <p className="text-sm text-destructive font-sans">{validationErrors.password}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-white font-sans font-medium"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
        </form>
        <div className="text-center mt-4">
          <a
            href="/setup"
            className="text-xs font-sans text-gray-500 hover:text-accent transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Configuração inicial
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
