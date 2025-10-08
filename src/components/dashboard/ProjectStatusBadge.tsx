
'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { ProjectStatus, ProjectStatusCategory } from '@/types';
import { defaultProjectStatuses } from '@/lib/data';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, PauseCircle, PlayCircle, Circle } from 'lucide-react';

interface ProjectStatusBadgeProps {
  statusId: string;
}

const categoryConfig: { [key in ProjectStatusCategory]: { variant: 'default' | 'secondary' | 'destructive' | 'outline', icon: React.ElementType, className: string } } = {
  'Completed': { 
    variant: 'default', 
    icon: CheckCircle,
    className: 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400 border-green-500/20'
  },
  'In Progress': { 
    variant: 'secondary', 
    icon: PlayCircle,
    className: 'bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20'
  },
  'On Hold': { 
    variant: 'outline', 
    icon: PauseCircle,
    className: 'bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-500/20'
  },
  'Cancelled': { 
    variant: 'destructive', 
    icon: XCircle,
    className: 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-500/20'
  },
  'Not Started': { 
    variant: 'outline', 
    icon: Circle,
    className: 'bg-gray-500/10 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-500/20'
  },
};

export default function ProjectStatusBadge({ statusId }: ProjectStatusBadgeProps) {
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);

  useEffect(() => {
    const storedStatuses = localStorage.getItem('sitepilot-project-statuses');
    if (storedStatuses) {
      try {
        setProjectStatuses(JSON.parse(storedStatuses));
      } catch (e) {
        setProjectStatuses(defaultProjectStatuses);
      }
    } else {
      setProjectStatuses(defaultProjectStatuses);
    }
  }, []);

  const status = projectStatuses.find(s => s.id === statusId);

  if (!status) {
    return <Badge variant="outline">{statusId}</Badge>;
  }

  const config = categoryConfig[status.category];
  const Icon = config.icon;

  return (
    <Badge className={cn('font-semibold border shadow-sm gap-1.5', config.className)}>
        <Icon className="h-3.5 w-3.5" />
        <span>{status.name}</span>
    </Badge>
  );
}
