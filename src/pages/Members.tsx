import { useEffect, useState, useMemo, useCallback, memo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { Search, Phone, Instagram } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/hooks/use-admin";

interface Member {
  id: string;
  full_name: string;
  phone: string;
  instagram: string | null;
  role: string;
  companies: { name: string }[];
  groups: { name: string; quota_number: number }[];
}

interface MemberCardProps {
  member: Member;
  isAdmin: boolean;
  onNavigate: (id: string) => void;
  formatPhone: (phone: string) => string;
}

const MemberCard = memo(({ member, isAdmin, onNavigate, formatPhone }: MemberCardProps) => {
  const handleCardClick = useCallback(() => {
    if (isAdmin) {
      onNavigate(member.id);
    }
  }, [isAdmin, onNavigate, member.id]);

  const handlePhoneClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(formatPhone(member.phone), '_blank', 'noopener,noreferrer');
  }, [formatPhone, member.phone]);

  const handleInstagramClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const username = member.instagram!.replace(/[@\s]/g, "");
    window.open(`https://www.instagram.com/${username}`, '_blank', 'noopener,noreferrer');
  }, [member.instagram]);

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{member.full_name}</CardTitle>
          <Badge variant={member.role === "admin" ? "default" : "secondary"}>
            {member.role === "admin" ? "Admin" : "Membro"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <button
            onClick={handlePhoneClick}
            className="text-sm hover:text-accent hover:underline transition-colors text-left cursor-pointer"
          >
            {member.phone}
          </button>
        </div>

        {member.instagram && (
          <div className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-muted-foreground" />
            <button
              onClick={handleInstagramClick}
              className="text-sm hover:text-accent hover:underline transition-colors text-left cursor-pointer"
            >
              {member.instagram}
            </button>
          </div>
        )}

        {member.companies.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Empresas:</p>
            <div className="flex flex-wrap gap-1">
              {member.companies.map((company, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {company.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {member.groups.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Grupos de Consórcio:</p>
            <div className="flex flex-wrap gap-1">
              {member.groups.map((group, idx) => (
                <Badge key={idx} variant="default" className="text-xs">
                  {group.name} - Cota #{group.quota_number}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    loadMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    if (searchTerm) {
      return members.filter((member) =>
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone.includes(searchTerm)
      );
    }
    return members;
  }, [searchTerm, members]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        phone,
        instagram,
        role
      `);

    if (!error && data) {
      const processedMembers = await Promise.all(
        data.map(async (member: {
          id: string;
          full_name: string;
          phone: string;
          instagram: string | null;
          role: string;
        }) => {
          const { data: quotasData } = await supabase
            .from("quotas")
            .select(`
              quota_number,
              group:groups (
                name
              )
            `)
            .eq("member_id", member.id)
            .order("quota_number");

          const groups = quotasData?.map((q: { quota_number: number; group: { name: string } }) => ({
            name: q.group.name,
            quota_number: q.quota_number,
          })) || [];

          return {
            ...member,
            companies: [],
            groups,
          };
        })
      );
      setMembers(processedMembers);
    }
    setLoading(false);
  }, []);

  const formatPhone = useCallback((phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    return `https://wa.me/55${cleanPhone}`;
  }, []);

  const handleNavigate = useCallback((id: string) => {
    navigate(`/members/${id}`);
  }, [navigate]);

  return (
    <Layout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Membros</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Lista de todos os membros cadastrados</p>
          </div>
          <Button onClick={() => navigate("/profile")} className="w-full sm:w-auto sm:self-start">
            Ver Meu Perfil
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isAdmin={isAdmin}
                onNavigate={handleNavigate}
                formatPhone={formatPhone}
              />
            ))}
          </div>
        )}

        {!loading && filteredMembers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum membro encontrado</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
    );
  }

export default memo(Members);
