

import { Project, Task } from '@/types';

// Overload signatures for type safety
export function getProjectProgress(project: Project & { tasks?: Task[] }): number;
export function getProjectProgress(project: Omit<Project, 'tasks'>, tasks: Task[]): number;

/**
 * Calculates the progress of a project based on its tracking mode.
 * It can accept tasks either as a property of the project object or as a separate argument.
 * @param project - The project object.
 * @param tasks - Optional array of tasks if not included in the project object.
 * @returns The project progress as a percentage (0-100).
 */
export function getProjectProgress(project: Project, tasks?: Task[]): number {
  const projectTasks = tasks || project.tasks || [];

  if (project.progressTrackingMode === 'manual') {
    return project.progress;
  }
  
  if (project.progressTrackingMode === 'task-driven') {
    if (projectTasks.length === 0) return 0;
    const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  }
  
  if (project.progressTrackingMode === 'milestone-driven') {
    if (project.milestones.length === 0) return 0;
    const achievedMilestones = project.milestones.filter(m => m.status === 'Achieved').length;
    return Math.round((achievedMilestones / project.milestones.length) * 100);
  }

  if (project.progressTrackingMode === 'mixed-mode') { // Corrected from 'task-milestone-driven'
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
    const totalMilestones = project.milestones.length;
    const achievedMilestones = project.milestones.filter(m => m.status === 'Achieved').length;

    const totalItems = totalTasks + totalMilestones;
    const completedItems = completedTasks + achievedMilestones;

    if (totalItems === 0) return 0;

    return Math.round((completedItems / totalItems) * 100);
  }
  
  return project.progress;
}
