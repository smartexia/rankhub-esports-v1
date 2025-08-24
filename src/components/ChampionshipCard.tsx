import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, Calendar, Zap } from "lucide-react";

interface Championship {
  id: string;
  name: string;
  description: string;
  status: "active" | "upcoming" | "finished";
  teams: number;
  maxTeams: number;
  startDate: string;
  endDate?: string;
  organizer: string;
}

interface ChampionshipCardProps {
  championship: Championship;
  onView: (id: string) => void;
  onJoin?: (id: string) => void;
  isManager?: boolean;
}

export function ChampionshipCard({ championship, onView, onJoin, isManager }: ChampionshipCardProps) {
  const getStatusColor = (status: Championship["status"]) => {
    switch (status) {
      case "active":
        return "bg-success text-success-foreground animate-pulse";
      case "upcoming":
        return "bg-warning text-warning-foreground";
      case "finished":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary";
    }
  };

  const getStatusIcon = (status: Championship["status"]) => {
    switch (status) {
      case "active":
        return <Zap className="h-3 w-3" />;
      case "upcoming":
        return <Calendar className="h-3 w-3" />;
      case "finished":
        return <Trophy className="h-3 w-3" />;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-dark border-primary/20 hover:border-primary/50 transition-all duration-300 hover:shadow-card group">
      <div className="absolute inset-0 bg-gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <CardHeader className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="font-orbitron text-foreground group-hover:text-glow">
              {championship.name}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {championship.description}
            </CardDescription>
          </div>
          <Badge 
            className={`${getStatusColor(championship.status)} flex items-center gap-1 font-rajdhani font-medium`}
          >
            {getStatusIcon(championship.status)}
            {championship.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 text-accent" />
            <span>{championship.teams}/{championship.maxTeams} Teams</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{new Date(championship.startDate).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-secondary/30 rounded-lg border border-border/50">
          <p className="text-xs text-muted-foreground">Organizer</p>
          <p className="font-medium text-foreground">{championship.organizer}</p>
        </div>
      </CardContent>

      <CardFooter className="relative z-10 flex gap-2">
        <Button 
          variant="gamer" 
          className="flex-1" 
          onClick={() => onView(championship.id)}
        >
          <Trophy className="h-4 w-4" />
          View Details
        </Button>
        
        {!isManager && championship.status !== "finished" && championship.teams < championship.maxTeams && (
          <Button 
            variant="secondary" 
            onClick={() => onJoin?.(championship.id)}
          >
            Join
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}