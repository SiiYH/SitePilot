
import { Project } from '@/types';

export function getProjectProgress(project: Project): number {
  if (project.progressTrackingMode === 'manual') {
    return project.progress;
  }
  
  if (project.progressTrackingMode === 'task-driven') {
    if (project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(t => t.status === 'Completed').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  }
  
  if (project.progressTrackingMode === 'milestone-driven') {
    if (project.milestones.length === 0) return 0;
    const achievedMilestones = project.milestones.filter(m => m.status === 'Achieved').length;
    return Math.round((achievedMilestones / project.milestones.length) * 100);
  }
  
  return project.progress;
}
