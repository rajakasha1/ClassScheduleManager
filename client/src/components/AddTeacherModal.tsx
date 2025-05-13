import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Teacher, TimePreference, DAYS_OF_WEEK, TIME_SLOTS } from "@shared/schema";
import { X } from "lucide-react";

interface AddTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherToEdit?: Teacher;
}

export default function AddTeacherModal({ isOpen, onClose, teacherToEdit }: AddTeacherModalProps) {
  const [name, setName] = useState(teacherToEdit?.name || "");
  const [specialization, setSpecialization] = useState(teacherToEdit?.specialization || "");
  const [skills, setSkills] = useState<string[]>(teacherToEdit?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [timePreferences, setTimePreferences] = useState<TimePreference[]>(
    teacherToEdit?.timePreferences || []
  );
  const [newPrefDay, setNewPrefDay] = useState<number>(0);
  const [newPrefStart, setNewPrefStart] = useState<number>(0);
  const [newPrefEnd, setNewPrefEnd] = useState<number>(0);

  const { toast } = useToast();

  const addTeacherMutation = useMutation({
    mutationFn: async (teacher: Omit<Teacher, 'id'>) => {
      if (teacherToEdit) {
        await apiRequest("PUT", `/api/teachers/${teacherToEdit.id}`, teacher);
        return { ...teacher, id: teacherToEdit.id };
      } else {
        const response = await apiRequest("POST", "/api/teachers", teacher);
        return await response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      toast({
        title: teacherToEdit ? "Teacher updated" : "Teacher added",
        description: teacherToEdit
          ? "The teacher has been updated successfully."
          : "A new teacher has been added successfully.",
        variant: "default",
      });
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${teacherToEdit ? "update" : "add"} teacher. Please try again.`,
        variant: "destructive",
      });
      console.error(`Error ${teacherToEdit ? "updating" : "adding"} teacher:`, error);
    },
  });

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleAddTimePreference = () => {
    if (newPrefEnd < newPrefStart) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    const newPref: TimePreference = {
      dayOfWeek: newPrefDay,
      startTimeSlot: newPrefStart,
      endTimeSlot: newPrefEnd,
    };

    setTimePreferences([...timePreferences, newPref]);
    setNewPrefDay(0);
    setNewPrefStart(0);
    setNewPrefEnd(0);
  };

  const handleRemoveTimePreference = (index: number) => {
    setTimePreferences(timePreferences.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: "Required field",
        description: "Teacher name is required.",
        variant: "destructive",
      });
      return;
    }

    const teacher = {
      name,
      specialization: specialization.trim() || undefined,
      skills,
      timePreferences,
    };

    addTeacherMutation.mutate(teacher as any);
  };

  const resetForm = () => {
    if (!teacherToEdit) {
      setName("");
      setSpecialization("");
      setSkills([]);
      setTimePreferences([]);
    } else {
      setName(teacherToEdit.name);
      setSpecialization(teacherToEdit.specialization || "");
      setSkills(teacherToEdit.skills || []);
      setTimePreferences(teacherToEdit.timePreferences || []);
    }
    setSkillInput("");
    setNewPrefDay(0);
    setNewPrefStart(0);
    setNewPrefEnd(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-display font-semibold text-lg text-neutral-darkest">
            {teacherToEdit ? "Edit Teacher" : "Add New Teacher"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-medium">
              Teacher Name <span className="text-error">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter teacher name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialization" className="font-medium">
              Specialization
            </Label>
            <Input
              id="specialization"
              placeholder="Enter specialization (e.g., Database Systems)"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="font-medium">Skills</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill (e.g., JavaScript)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
              <Button 
                type="button" 
                onClick={handleAddSkill}
                variant="secondary"
                className="shrink-0"
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill, index) => (
                <div 
                  key={index} 
                  className="bg-blue-100 text-blue-800 py-0.5 px-2 rounded-full text-xs flex items-center"
                >
                  {skill}
                  <button 
                    type="button" 
                    className="ml-1 text-blue-800 hover:text-blue-900"
                    onClick={() => handleRemoveSkill(index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="font-medium">Time Preferences</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="prefDay" className="text-xs">Day</Label>
                <select
                  id="prefDay"
                  className="w-full p-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newPrefDay}
                  onChange={(e) => setNewPrefDay(Number(e.target.value))}
                >
                  {DAYS_OF_WEEK.map((day, index) => (
                    <option key={index} value={index}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="prefStart" className="text-xs">Start Time</Label>
                <select
                  id="prefStart"
                  className="w-full p-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newPrefStart}
                  onChange={(e) => setNewPrefStart(Number(e.target.value))}
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label.split(' - ')[0]}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="prefEnd" className="text-xs">End Time</Label>
                <select
                  id="prefEnd"
                  className="w-full p-2 border border-neutral-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newPrefEnd}
                  onChange={(e) => setNewPrefEnd(Number(e.target.value))}
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label.split(' - ')[1]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleAddTimePreference}
              className="mt-2"
            >
              Add Time Preference
            </Button>
            
            <div className="space-y-2 mt-3">
              {timePreferences.length > 0 ? (
                <div className="space-y-2">
                  {timePreferences.map((pref, index) => {
                    const dayName = DAYS_OF_WEEK[pref.dayOfWeek];
                    const startTime = TIME_SLOTS[pref.startTimeSlot]?.label.split(' - ')[0] || '';
                    const endTime = TIME_SLOTS[pref.endTimeSlot]?.label.split(' - ')[1] || '';
                    
                    return (
                      <div key={index} className="flex justify-between items-center bg-neutral-lightest p-2 rounded-md">
                        <span className="text-sm text-neutral-darkest">
                          {dayName} {startTime} - {endTime}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTimePreference(index)}
                          className="text-neutral-dark hover:text-error h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-neutral-dark italic">
                  No time preferences added.
                </div>
              )}
            </div>
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
              disabled={addTeacherMutation.isPending}
            >
              {addTeacherMutation.isPending
                ? "Saving..."
                : teacherToEdit
                ? "Update Teacher"
                : "Add Teacher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
