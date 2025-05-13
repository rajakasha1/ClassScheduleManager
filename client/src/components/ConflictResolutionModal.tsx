import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Conflict, ConflictSuggestion } from "@shared/schema";
import { useTeacherData } from "@/hooks/useTeacherData";
import { useCourseData } from "@/hooks/useCourseData";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConflictResolutionModal({ isOpen, onClose }: ConflictResolutionModalProps) {
  const [selectedConflict, setSelectedConflict] = useState<number | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: conflicts = [] } = useQuery<Conflict[]>({
    queryKey: ['/api/conflicts'],
  });

  const { getTeacherById } = useTeacherData();
  const { getCourseById } = useCourseData();

  const unresolved = conflicts.filter(conflict => !conflict.resolved);

  const applySuggestionMutation = useMutation({
    mutationFn: async ({ conflictId, suggestionId }: { conflictId: number; suggestionId: string }) => {
      await apiRequest("POST", `/api/conflicts/${conflictId}/resolve`, { suggestionId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conflicts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedules'] });
      toast({
        title: "Conflict resolved",
        description: "The schedule conflict has been resolved successfully.",
        variant: "default",
      });
      setSelectedConflict(null);
      setSelectedSuggestion(null);
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to resolve conflict. Please try again.",
        variant: "destructive",
      });
      console.error("Error resolving conflict:", error);
    },
  });

  const handleApplySolutions = () => {
    if (selectedConflict !== null && selectedSuggestion !== null) {
      applySuggestionMutation.mutate({
        conflictId: selectedConflict,
        suggestionId: selectedSuggestion
      });
    } else {
      toast({
        title: "Selection required",
        description: "Please select a solution to apply.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display font-semibold text-lg text-neutral-darkest">
            Resolve Scheduling Conflicts
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {unresolved.length === 0 ? (
            <div className="text-center py-6 text-neutral-dark">
              No conflicts to resolve. Your schedule is clear!
            </div>
          ) : (
            unresolved.map((conflict, index) => {
              const teacher = getTeacherById(conflict.teacherId);
              const conflictingCourses = conflict.conflictingScheduleIds.map(
                id => getCourseById(id)?.name || 'Unknown Course'
              ).join(' and ');
              
              return (
                <div key={conflict.id} className="mb-5">
                  <h3 className="font-medium text-neutral-darkest text-lg mb-3">
                    Conflict #{index + 1}: {teacher?.name || 'Unknown Teacher'}
                  </h3>
                  <div className="bg-neutral-lightest p-3 rounded-md mb-3">
                    <p className="text-sm text-neutral-darkest">
                      {teacher?.name || 'Unknown Teacher'} is scheduled for <span className="font-medium">{conflictingCourses}</span> simultaneously on {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][conflict.dayOfWeek]} at {['6:30-7:20 AM', '7:20-8:10 AM', '8:10-9:00 AM', '9:20-10:10 AM', '10:10-11:00 AM'][conflict.timeSlot]}.
                    </p>
                  </div>
                  
                  <h4 className="font-medium text-neutral-darkest mb-2">Suggested Solutions:</h4>
                  {conflict.suggestions && conflict.suggestions.length > 0 ? (
                    <RadioGroup 
                      value={selectedConflict === conflict.id ? selectedSuggestion || undefined : undefined}
                      onValueChange={(value) => {
                        setSelectedConflict(conflict.id);
                        setSelectedSuggestion(value);
                      }}
                    >
                      <div className="space-y-2">
                        {conflict.suggestions.map((suggestion: ConflictSuggestion) => (
                          <div 
                            key={suggestion.id} 
                            className={`border border-neutral-light p-3 rounded-md hover:bg-neutral-lightest transition cursor-pointer ${
                              selectedConflict === conflict.id && selectedSuggestion === suggestion.id ? 'bg-neutral-lightest' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <RadioGroupItem value={suggestion.id} id={suggestion.id} className="h-4 w-4 rounded-full mr-3 flex-shrink-0" />
                              <Label htmlFor={suggestion.id} className="text-sm text-neutral-darkest cursor-pointer">
                                {suggestion.description}
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <div className="text-sm text-neutral-dark italic p-3">
                      No suggestions available for this conflict.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        <DialogFooter className="p-4 border-t border-neutral-light bg-neutral-lightest flex justify-end space-x-3">
          <Button
            variant="outline"
            className="px-4 py-2 border border-neutral-light rounded-md text-neutral-darkest hover:bg-neutral-light"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            className="px-4 py-2 bg-primary hover:bg-primary-light text-white rounded-md"
            onClick={handleApplySolutions}
            disabled={applySuggestionMutation.isPending || unresolved.length === 0}
          >
            {applySuggestionMutation.isPending ? "Applying..." : "Apply Solutions"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
