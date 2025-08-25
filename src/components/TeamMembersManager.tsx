import React, { useState } from 'react';
import { Users, Plus, Trash2, Crown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useTeamMembers, TeamMember, User as UserType } from '@/hooks/useTeamMembers';
import { toast } from 'sonner';

interface TeamMembersManagerProps {
  teamId: string;
  teamName: string;
}

const TeamMembersManager: React.FC<TeamMembersManagerProps> = ({ teamId, teamName }) => {
  const { members, availableUsers, loading, addTeamMember, removeTeamMember, updateMemberRole } = useTeamMembers(teamId);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<'captain' | 'player'>('player');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      toast.error('Selecione um jogador');
      return;
    }

    setIsSubmitting(true);
    const success = await addTeamMember(selectedUserId, selectedRole);
    
    if (success) {
      setIsAddDialogOpen(false);
      setSelectedUserId('');
      setSelectedRole('player');
    }
    
    setIsSubmitting(false);
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (window.confirm(`Tem certeza que deseja remover ${member.user?.nome_usuario} do time?`)) {
      await removeTeamMember(member.id);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: 'captain' | 'player') => {
    await updateMemberRole(memberId, newRole);
  };

  const getRoleIcon = (role: string) => {
    return role === 'captain' ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />;
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'captain' ? 'default' : 'secondary';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros do Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Carregando membros...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros do Time ({members.length})
          </CardTitle>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Membro ao Time</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Selecionar Jogador
                  </label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um jogador" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.nome_usuario)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.nome_usuario}</span>
                            <span className="text-muted-foreground text-sm">({user.email})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableUsers.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Não há jogadores disponíveis para adicionar ao time.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Função no Time
                  </label>
                  <Select value={selectedRole} onValueChange={(value: 'captain' | 'player') => setSelectedRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Jogador
                        </div>
                      </SelectItem>
                      <SelectItem value="captain">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Capitão
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleAddMember} 
                    disabled={!selectedUserId || isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? 'Adicionando...' : 'Adicionar Membro'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsAddDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum membro no time</h3>
            <p className="text-muted-foreground mb-4">
              Adicione jogadores ao time {teamName} para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(member.user?.nome_usuario || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <div className="font-medium">{member.user?.nome_usuario}</div>
                    <div className="text-sm text-muted-foreground">{member.user?.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Entrou em: {new Date(member.joined_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select 
                    value={member.role} 
                    onValueChange={(value: 'captain' | 'player') => handleRoleChange(member.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Jogador
                        </div>
                      </SelectItem>
                      <SelectItem value="captain">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4" />
                          Capitão
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center gap-1">
                    {getRoleIcon(member.role)}
                    {member.role === 'captain' ? 'Capitão' : 'Jogador'}
                  </Badge>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveMember(member)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMembersManager;