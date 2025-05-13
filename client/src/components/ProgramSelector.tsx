import { useEffect } from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Program } from "@shared/schema";

interface ProgramSelectorProps {
  program: string;
  semester: number;
  view: 'weekly' | 'daily';
  onProgramChange: (program: string) => void;
  onSemesterChange: (semester: number) => void;
  onViewChange: (view: 'weekly' | 'daily') => void;
}

export default function ProgramSelector({
  program,
  semester,
  view,
  onProgramChange,
  onSemesterChange,
  onViewChange
}: ProgramSelectorProps) {
  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  useEffect(() => {
    // Set default program if not set and programs are loaded
    if (programs.length > 0 && !program) {
      onProgramChange(programs[0].code);
    }
  }, [programs, program, onProgramChange]);

  return (
    <Card className="bg-white rounded-lg shadow-md mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap md:flex-nowrap gap-4 items-center">
          <div className="w-full md:w-1/3">
            <Label htmlFor="program" className="block text-sm font-medium text-neutral-dark mb-1">
              Program
            </Label>
            <Select value={program} onValueChange={onProgramChange}>
              <SelectTrigger id="program" className="w-full p-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((prog) => (
                  <SelectItem key={prog.code} value={prog.code}>
                    {prog.code} - {prog.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/3">
            <Label htmlFor="semester" className="block text-sm font-medium text-neutral-dark mb-1">
              Semester
            </Label>
            <Select value={semester.toString()} onValueChange={(value) => onSemesterChange(parseInt(value))}>
              <SelectTrigger id="semester" className="w-full p-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                <SelectValue placeholder="Select a semester" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/3">
            <Label htmlFor="view" className="block text-sm font-medium text-neutral-dark mb-1">
              View
            </Label>
            <div className="flex rounded-md overflow-hidden border border-neutral-light">
              <Button
                type="button"
                variant={view === 'weekly' ? 'default' : 'ghost'}
                className={`flex-1 py-2 px-4 text-sm font-medium ${
                  view === 'weekly' ? 'bg-primary text-white' : 'bg-white text-neutral-darkest hover:bg-neutral-lightest'
                }`}
                onClick={() => onViewChange('weekly')}
              >
                Weekly
              </Button>
              <Button
                type="button"
                variant={view === 'daily' ? 'default' : 'ghost'}
                className={`flex-1 py-2 px-4 text-sm font-medium ${
                  view === 'daily' ? 'bg-primary text-white' : 'bg-white text-neutral-darkest hover:bg-neutral-lightest'
                }`}
                onClick={() => onViewChange('daily')}
              >
                Daily
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
