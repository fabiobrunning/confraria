import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";

/**
 * Hook para verificar se o usuário atual é um administrador
 * @param redirectNonAdmin Se true, redireciona usuários não-admin para o dashboard
 * @param showToast Se true, exibe uma mensagem de toast para usuários não-admin
 * @returns Um objeto com o estado de admin e loading
 */
export function useAdmin(redirectNonAdmin = false, showToast = false) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true);
      
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (redirectNonAdmin) {
          navigate("/auth");
        }
        setLoading(false);
        return;
      }

      // Verificar se o usuário é admin
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      const userIsAdmin = data?.role === "admin";
      setIsAdmin(userIsAdmin);

      // Redirecionar se não for admin e redirectNonAdmin for true
      if (!userIsAdmin && redirectNonAdmin) {
        if (showToast) {
          toast({
            title: "Acesso negado",
            description: "Apenas administradores podem acessar esta página",
            variant: "destructive",
          });
        }
        navigate("/dashboard");
      }

      setLoading(false);
    };

    checkAdmin();
  }, [navigate, redirectNonAdmin, showToast, toast]);

  return { isAdmin, loading };
}