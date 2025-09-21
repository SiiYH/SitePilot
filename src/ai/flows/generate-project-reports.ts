'use server';

/**
 * @fileOverview Generates automated progress reports for each project using AI.
 *
 * - generateProjectReport - A function to generate a project progress report.
 * - GenerateProjectReportInput - The input type for the generateProjectReport function.
 * - GenerateProjectReportOutput - The return type for the generateProjectReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProjectReportInputSchema = z.object({
  projectName: z.string().describe('The name of the project.'),
  taskCompletionData: z.string().describe('A summary of task completion data, including tasks completed, tasks in progress, and overdue tasks.'),
  milestoneData: z.string().describe('A summary of milestone data, including milestones achieved, upcoming milestones, and delayed milestones.'),
});
export type GenerateProjectReportInput = z.infer<typeof GenerateProjectReportInputSchema>;

const GenerateProjectReportOutputSchema = z.object({
  report: z.string().describe('A narrative summary of the project progress.'),
});
export type GenerateProjectReportOutput = z.infer<typeof GenerateProjectReportOutputSchema>;

export async function generateProjectReport(input: GenerateProjectReportInput): Promise<GenerateProjectReportOutput> {
  return generateProjectReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateProjectReportPrompt',
  input: {schema: GenerateProjectReportInputSchema},
  output: {schema: GenerateProjectReportOutputSchema},
  prompt: `You are an AI assistant tasked with generating project progress reports for construction projects. You will receive task completion data and milestone data for a given project, and you will use this information to generate a concise narrative summary of the project's progress.

Project Name: {{{projectName}}}
Task Completion Data: {{{taskCompletionData}}}
Milestone Data: {{{milestoneData}}}

Generate a report summarizing the project's progress, highlighting key achievements, potential delays, and overall status. The report should be suitable for sharing with stakeholders. Keep it concise and professional.`, // Improved prompt for clarity and instructions
});

const generateProjectReportFlow = ai.defineFlow(
  {
    name: 'generateProjectReportFlow',
    inputSchema: GenerateProjectReportInputSchema,
    outputSchema: GenerateProjectReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
