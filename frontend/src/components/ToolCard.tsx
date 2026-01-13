import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

export const ToolCard = ({ title, description, icon: Icon, href }: ToolCardProps) => {
  return (
    <Link to={href}>
      <Card className="group hover-lift cursor-pointer h-full bg-card border-border shadow-card hover:shadow-hover transition-all duration-300 rounded-2xl overflow-hidden">
        <CardHeader className="p-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary mb-4 group-hover:bg-primary transition-all group-hover:scale-110">
            <Icon className="h-7 w-7 text-secondary-foreground group-hover:text-primary-foreground transition-colors" />
          </div>
          <CardTitle className="text-xl font-semibold group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
};
