import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Setup() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const createMasterAdmin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-master-admin');
      
      if (error) throw error;
      
      if (data.success) {
        setSuccess(true);
        toast({
          title: "Sucesso!",
          description: "Usuário master criado com sucesso. Use telefone: 48991836483 e senha: confraria",
        });
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
      <Card className="w-full max-w-md shadow-2xl border-accent/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>
            Crie o usuário administrador master do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <div className="space-y-2">
                <p className="font-semibold">Usuário master criado!</p>
                <div className="bg-muted p-4 rounded-lg text-left space-y-1 text-sm">
                  <p><strong>Telefone:</strong> 48991836483</p>
                  <p><strong>Senha:</strong> confraria</p>
                </div>
                <Button onClick={() => window.location.href = '/auth'} className="w-full">
                  Ir para Login
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Clique no botão abaixo para criar o usuário administrador master com as seguintes credenciais:
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
