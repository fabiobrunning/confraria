import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAsyncAction } from "@/hooks/use-async";
import { authSchema, type AuthFormData } from "@/schemas";
import { logError } from "@/utils/logger";
import { maskPhone } from "@/utils/phone";

export default function Auth() {
  const [formData, setFormData] = useState<AuthFormData>({
    phone: "",
    password: "",
  });
  const [validationErrors, setValidationErrors] = useState<Partial<AuthFormData>>({});
  const { loading, error, execute } = useAsyncAction();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
      // Remove non-digits from phone and create email
      const cleanPhone = formData.phone.replace(/\D/g, "");
      const email = `${cleanPhone}@confraria.local`;

      // Try to sign in with the email/password
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });

      if (error) {
        // Check if it's an invalid credentials error
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Telefone ou senha incorretos.");
        } else {
          throw new Error(error.message);
        }
      }
    });

    if (!success && error) {
      toast({
        title: "Erro ao fazer login",
        description: error,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
      <Card className="w-full max-w-md shadow-2xl border-accent/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center">
              <span className="text-2xl font-bold text-accent-foreground">CP</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Confraria Pedra Branca</CardTitle>
          <CardDescription>Sistema de Gestão de Consórcios</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: maskPhone(e.target.value) }))}
                disabled={loading}
                className={validationErrors.phone ? "border-destructive" : ""}
                maxLength={15}
              />
              {validationErrors.phone && (
                <p className="text-sm text-destructive">{validationErrors.phone}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={loading}
                className={validationErrors.password ? "border-destructive" : ""}
              />
              {validationErrors.password && (
                <p className="text-sm text-destructive">{validationErrors.password}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
          <div className="mt-4 text-center">
            <a href="/setup" className="text-xs text-muted-foreground hover:text-accent transition-colors">
              Configuração inicial
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
