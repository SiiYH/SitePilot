# **App Name**: SiteFlow

## Core Features:

- Role-Based Authentication: Allow users to register and authenticate as either 'Engineer', 'Admin', or 'Director'. For engineers without email addresses, provide authentication via SMS verification. A welcome message will be displayed with their name and role upon login.
- Project Dashboard: Display a summary of all active construction projects, including key milestones, deadlines, and overall progress. Differentiate based on user role to show project-relevant information (e.g., an engineer only sees their assigned projects).
- Task Management: Enable the creation, assignment, and tracking of individual tasks within each project.  Allow engineers to update task status (e.g., 'In Progress', 'Completed'), and Admins/Directors to monitor progress. Task assignments take user roles into account.
- Document Repository: Provide a centralized location to upload and manage project-related documents (e.g., blueprints, contracts, permits). Implement role-based access control to restrict document visibility (e.g., only Directors can view contracts).
- Progress Reporting: Generate automated progress reports for each project based on task completion and milestone tracking. AI-powered tool interprets raw progress data and provides narrative summaries for stakeholders.
- Password Recovery: For users with email addresses, implement standard password recovery via email. For engineers registered via SMS, use SMS verification for password reset.

## Style Guidelines:

- Primary color: Steel Blue (#4682B4) to convey reliability and professionalism, nodding towards engineering aesthetics.
- Background color: Light Gray (#F0F8FF), providing a clean and neutral backdrop.
- Accent color: Coral (#FF7F50) to highlight important actions and elements with energy.
- Font: 'Inter', a grotesque sans-serif for a modern, neutral, and objective feel, suitable for both headlines and body text.
- Use clear, geometric icons to represent different project elements and actions. Maintain consistency in style and size throughout the app.
- Prioritize a clean and organized layout with clear visual hierarchy. Use card-based designs for project summaries and task management.
- Incorporate subtle transitions and animations to provide feedback and enhance user experience (e.g., loading indicators, progress bar animations).