import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Course, Program, Teacher } from "@shared/schema";

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseToEdit?: Course;
}

export default function AddCourseModal({ isOpen, onClose, courseToEdit }: AddCourseModalProps) {
  const [name, setName] = useState(courseToEdit?.name || "");
  const [code, setCode] = useState(courseToEdit?.code || "");
  const [credits, setCredits] = useState(courseToEdit?.credits || 3);
  const [description, setDescription] = useState(courseToEdit?.description || "");
  const [color, setColor] = useState(courseToEdit?.color || "blue");
  const [isCore, setIsCore] = useState(courseToEdit?.isCore ?? true);
  const [programId, setProgramId] = useState<number | undefined>(courseToEdit?.programId);
  const [semester, setSemester] = useState(courseToEdit?.semester || 1);
  const [teacherId, setTeacherId] = useState<number | undefined>(courseToEdit?.teacherId);

  const { toast } = useToast();

  const { data: programs = [] } = useQuery<Program[]>({
    queryKey: ['/api/programs'],
  });

  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  useEffect(() => {
    // Set default program if not set and programs are loaded
    if (programs.length > 0 && !programId) {
      setProgramId(programs[0].id);
    }
  }, [programs, programId]);

  const addCourseMutation = useMutation({
    mutationFn: async (course: Omit<Course, 'id'>) => {
      if (courseToEdit) {
        await apiRequest("PUT", `/api/courses/${courseToEdit.id}`, course);
        return { ...course, id: courseToEdit.id };
      } else {
        const response = await apiRequest("POST", "/api/courses", course);
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      toast({
        title: courseToEdit ? "Course updated" : "Course added",
        description: courseToEdit
          ? "The course has been updated successfully."
          : "A new course has been added successfully.",
        variant: "default",
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${courseToEdit ? "update" : "add"} course. Please try again.`,
        variant: "destructive",
      });
      console.error(`Error ${courseToEdit ? "updating" : "adding"} course:`, error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !code.trim() || !programId || !semester) {
      toast({
        title: "Required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const course = {
      name: name.trim(),
      code: code.trim(),
      credits,
      description: description.trim() || undefined,
      color,
      isCore,
      programId,
      semester,
      teacherId: teacherId || null,
    };

    addCourseMutation.mutate(course as any);
  };

  const resetForm = () => {
    if (!courseToEdit) {
      setName("");
      setCode("");
      setCredits(3);
      setDescription("");
      setColor("blue");
      setIsCore(true);
      setProgramId(programs.length > 0 ? programs[0].id : undefined);
      setSemester(1);
      setTeacherId(undefined);
    } else {
      setName(courseToEdit.name);
      setCode(courseToEdit.code);
      setCredits(courseToEdit.credits);
      setDescription(courseToEdit.description || "");
      setColor(courseToEdit.color);
      setIsCore(courseToEdit.isCore);
      setProgramId(courseToEdit.programId);
      setSemester(courseToEdit.semester);
      setTeacherId(courseToEdit.teacherId);
    }
  };

  const colorOptions = [
    { id: 'red', label: 'Red', class: 'bg-red-500' },
    { id: 'blue', label: 'Blue', class: 'bg-blue-500' },
    { id: 'green', label: 'Green', class: 'bg-emerald-500' },
    { id: 'purple', label: 'Purple', class: 'bg-purple-500' },
    { id: 'amber', label: 'Amber', class: 'bg-amber-500' },
    { id: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-display font-semibold text-lg text-neutral-darkest">
            {courseToEdit ? "Edit Course" : "Add New Course"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-medium">
              Course Name <span className="text-error">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter course name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code" className="font-medium">
              Course Code <span className="text-error">*</span>
            </Label>
            <Input
              id="code"
              placeholder="Enter course code (e.g., CS301)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="credits" className="font-medium">
                Credits <span className="text-error">*</span>
              </Label>
              <select
                id="credits"
                className="w-full p-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                required
              >
                {[1, 2, 3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>
                    {value} {value === 1 ? 'Credit' : 'Credits'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="font-medium flex items-center justify-between">
                Core Course
                <Switch
                  checked={isCore}
                  onCheckedChange={setIsCore}
                />
              </Label>
              <p className="text-xs text-neutral-dark">
                {isCore ? 'This is a mandatory course.' : 'This is an elective course.'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter course description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="font-medium">
              Course Color
            </Label>
            <RadioGroup
              value={color}
              onValueChange={setColor}
              className="flex flex-wrap gap-4"
            >
              {colorOptions.map((colorOption) => (
                <div key={colorOption.id} className="flex items-center space-x-2">
                  <RadioGroupItem 
                    value={colorOption.id} 
                    id={`color-${colorOption.id}`} 
                    className="sr-only"
                  />
                  <Label
                    htmlFor={`color-${colorOption.id}`}
                    className={`h-8 w-8 rounded-full cursor-pointer flex items-center justify-center border-2 ${
                      color === colorOption.id 
                        ? 'border-primary' 
                        : 'border-transparent hover:border-neutral-light'
                    }`}
                  >
                    <span className={`h-6 w-6 rounded-full ${colorOption.class}`} />
                    <span className="sr-only">{colorOption.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program" className="font-medium">
                Program <span className="text-error">*</span>
              </Label>
              <Select 
                value={programId?.toString()} 
                onValueChange={(value) => setProgramId(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="semester" className="font-medium">
                Semester <span className="text-error">*</span>
              </Label>
              <Select 
                value={semester.toString()} 
                onValueChange={(value) => setSemester(Number(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      Semester {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="teacher" className="font-medium">
              Assigned Teacher
            </Label>
            <Select 
              value={teacherId?.toString() || ''} 
              onValueChange={(value) => setTeacherId(value ? Number(value) : undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a teacher (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addCourseMutation.isPending}
            >
              {addCourseMutation.isPending
                ? "Saving..."
                : courseToEdit
                ? "Update Course"
                : "Add Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
