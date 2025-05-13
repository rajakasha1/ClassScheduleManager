import { toPng } from 'html-to-image';

/**
 * Exports the schedule grid to an image file
 */
export const exportToImage = async (): Promise<void> => {
  const element = document.querySelector('.schedule-grid');
  
  if (!element) {
    throw new Error('Schedule grid element not found');
  }
  
  try {
    const dataUrl = await toPng(element as HTMLElement, {
      quality: 0.95,
      backgroundColor: 'white',
      width: element.scrollWidth,
      height: element.scrollHeight,
    });
    
    // Create link and trigger download
    const link = document.createElement('a');
    link.download = `class-schedule-${new Date().toISOString().split('T')[0]}.png`;
    link.href = dataUrl;
    link.click();
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error exporting schedule to image:', error);
    return Promise.reject(error);
  }
};

/**
 * Creates dummy function to handle PDF export
 * This would need to be implemented with a library like jsPDF or react-to-print
 */
export const exportToPDF = async (): Promise<void> => {
  try {
    // Implementation would go here
    // For MVP, we'll just use the image export
    return exportToImage();
  } catch (error) {
    console.error('Error exporting schedule to PDF:', error);
    return Promise.reject(error);
  }
};
