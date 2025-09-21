'use server';

import { generateProjectReport, GenerateProjectReportInput } from '@/ai/flows/generate-project-reports';

export async function getAiReport(input: GenerateProjectReportInput) {
  try {
    const output = await generateProjectReport(input);
    return { success: true, report: output.report };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Failed to generate report.' };
  }
}
