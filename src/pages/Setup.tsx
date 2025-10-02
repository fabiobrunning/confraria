import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { logError } from "@/utils/logger";

export default function Setup() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [masterExists, setMasterExists] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkMasterAdmin();
  }, []);

  const checkMasterAdmin = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', '48991836483')
        .eq('role', 'admin')
        .maybeSingle();

      if (data) {
        setMasterExists(true);
      }
    } catch (error) {
      logError(error, 'Setup - checkMasterAdmin');
    } finally {
      setChecking(false);
    }
  };

  const createMasterAdmin = async () => {
    setLoading(true);
    try {
      const email = '48991836483@confraria.local';
      const password = 'confraria';

      // Try to sign up the master admin user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            phone: '48991836483'
          }
        }
      });

      if (error) {
        // Check if user already exists
        if (error.message.includes('already registered')) {
          toast({
            title: "Usuário já existe",
            description: "O usuário master já foi criado. Você pode fazer login agora.",
          });
          setMasterExists(true);
        } else {
          throw error;
        }
      } else if (data.user) {
        toast({
          title: "Sucesso!",
          description: "Usuário master criado com sucesso!",
        });
        setMasterExists(true);

        // Sign out the user so they can log in properly
        await supabase.auth.signOut();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao criar usuário master";
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
      <Card className="w-full max-w-md shadow-2xl border-accent/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>
            {masterExists ? 'Sistema configurado' : 'Configure o usuário administrador master'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {masterExists ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <div className="space-y-2">
                <p className="font-semibold">Usuário master já está criado!</p>
                <div className="bg-muted p-4 rounded-lg text-left space-y-1 text-sm">
                  <p><strong>Telefone:</strong> 48991836483</p>
                  <p><strong>Senha:</strong> confraria</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Altere a senha após o primeiro login
                  </p>
                </div>
                <Button onClick={() => navigate('/auth')} className="w-full">
                  Ir para Login
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Clique no botão abaixo para criar o usuário administrador master.
              </p>
              <div className="bg-muted p-4 rounded-lg space-y-1 text-sm">
                <p><strong>Telefone:</strong> 48991836483</p>
                <p><strong>Senha:</strong> confraria</p>
                <p><strong>Nível:</strong> Administrador</p>
              </div>
              <Button
                onClick={createMasterAdmin}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Usuário Master
              </Button>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full"
                variant="outline"
              >
                Ir para Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
