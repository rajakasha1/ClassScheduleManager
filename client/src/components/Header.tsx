import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useScheduleData } from "@/hooks/useScheduleData";
import { exportToImage } from "@/utils/exportUtils";
import { Save, Download } from "lucide-react";

export default function Header() {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { saveScheduleChanges } = useScheduleData();

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      await saveScheduleChanges();
      toast({
        title: "Schedule saved",
        description: "Your class schedule has been saved successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error saving schedule",
        description: "Failed to save your schedule changes. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving schedule:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportSchedule = async () => {
    try {
      await exportToImage();
      toast({
        title: "Schedule exported",
        description: "Your class schedule has been exported successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error exporting schedule",
        description: "Failed to export your schedule. Please try again.",
        variant: "destructive",
      });
      console.error("Error exporting schedule:", error);
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-3 mb-3 md:mb-0">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
            PU
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-primary">PUSST Academic Scheduler</h1>
            <p className="text-sm text-neutral-dark">Purbanchal University School of Science and Technology</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            variant="secondary" 
            className="flex items-center space-x-2 text-sm bg-secondary hover:bg-secondary-light text-white px-4 py-2"
            onClick={handleExportSchedule}
          >
            <Download className="h-4 w-4" />
            <span>Export Schedule</span>
          </Button>
          <Button 
            variant="default" 
            className="flex items-center space-x-2 text-sm bg-primary hover:bg-primary-light text-white px-4 py-2"
            onClick={handleSaveChanges}
            disabled={saving}
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
