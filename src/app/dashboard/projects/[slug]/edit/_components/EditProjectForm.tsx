
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Check, ChevronsUpDown, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { User, Project } from '@/types';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { mockProjects } from '@/lib/data'; // to update mock data

interface EditProjectFormProps {
  project: Project;
  engineers: User[];
}

const formSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  deadline: z.date({ required_error: 'A deadline is required.' }),
  assignedEngineers: z.array(z.string()).min(1, 'At least one engineer must be assigned.'),
});

export default function EditProjectForm({ project, engineers }: EditProjectFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: project.name,
      description: project.description,
      deadline: parseISO(project.deadline),
      assignedEngineers: project.assignedEngineers,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    // In a real app, this would be an API call to update the project.
    // For this mock, we'll find and update the project in the mockProjects array.
    const projectIndex = mockProjects.findIndex(p => p.id === project.id);
    if (projectIndex !== -1) {
      mockProjects[projectIndex] = {
        ...mockProjects[projectIndex],
        ...values,
        deadline: values.deadline.toISOString(),
      };
    }
    
    setTimeout(() => {
      toast({
        title: 'Project Updated',
        description: `${values.name} has been successfully updated.`,
      });
      setIsLoading(false);
      // It's good practice to push the router to the updated project page
      // to see the changes reflect.
      router.push(`/dashboard/projects/${project.slug}`);
      router.refresh(); // To ensure server component re-fetches data
    }, 1000);
  };

  return (
    <Card>
      <CardHeader>
          <CardTitle>Project Information</CardTitle>
          <CardDescription>Update the form below and click save.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Apex Tower" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A short description of the project." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Deadline</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assignedEngineers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Engineers</FormLabel>
                  <Controller
                    control={form.control}
                    name="assignedEngineers"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" role="combobox" className="w-full justify-between">
                            {field.value?.length > 0
                              ? `${field.value.length} engineer(s) selected`
                              : 'Select engineers...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Search engineers..." />
                            <CommandList>
                                <CommandEmpty>No engineers found.</CommandEmpty>
                                <CommandGroup>
                                {engineers.map((engineer) => (
                                    <CommandItem
                                    key={engineer.id}
                                    onSelect={() => {
                                        const selected = field.value || [];
                                        const newValue = selected.includes(engineer.id)
                                        ? selected.filter((id) => id !== engineer.id)
                                        : [...selected, engineer.id];
                                        field.onChange(newValue);
                                    }}
                                    >
                                    <Check
                                        className={cn(
                                        'mr-2 h-4 w-4',
                                        field.value?.includes(engineer.id) ? 'opacity-100' : 'opacity-0'
                                        )}
                                    />
                                    {engineer.name}
                                    </CommandItem>
                                ))}
                                </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
