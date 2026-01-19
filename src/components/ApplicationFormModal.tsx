import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApplicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ApplicationFormModal = ({ isOpen, onClose }: ApplicationFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    university: "",
    year: "",
    major: "",
    email: "",
    whyJustOne: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (!file) {
      setResumeFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError("Please upload a PDF or Word document");
      setResumeFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size must be less than 5MB");
      setResumeFile(null);
      return;
    }

    setResumeFile(file);
  };

  const handleRemoveFile = () => {
    setResumeFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 content after the data URL prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let resumeData = null;
      
      if (resumeFile) {
        const base64Content = await fileToBase64(resumeFile);
        resumeData = {
          filename: resumeFile.name,
          content: base64Content,
          type: resumeFile.type,
        };
      }

      const { error } = await supabase.functions.invoke("send-career-application", {
        body: {
          ...formData,
          resume: resumeData,
        },
      });

      if (error) throw error;

      setIsSubmitted(true);
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsSubmitted(false);
    setResumeFile(null);
    setFileError(null);
    setFormData({
      fullName: "",
      university: "",
      year: "",
      major: "",
      email: "",
      whyJustOne: "",
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
          >
            <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-[520px] max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
                <h2 className="font-serif text-xl text-foreground">
                  {isSubmitted ? "Application Received" : "Apply"}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <p className="text-muted-foreground leading-relaxed">
                      Thank you for applying. We'll review your application and get back to you if it's a fit.
                    </p>
                    <Button
                      onClick={handleClose}
                      variant="outline"
                      className="mt-8"
                    >
                      Close
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm text-foreground">
                        Full name
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        className="bg-background"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="university" className="text-sm text-foreground">
                          University
                        </Label>
                        <Input
                          id="university"
                          name="university"
                          value={formData.university}
                          onChange={handleChange}
                          required
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="year" className="text-sm text-foreground">
                          Year
                        </Label>
                        <Input
                          id="year"
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          placeholder="e.g. 2nd Year"
                          required
                          className="bg-background"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="major" className="text-sm text-foreground">
                          Major
                        </Label>
                        <Input
                          id="major"
                          name="major"
                          value={formData.major}
                          onChange={handleChange}
                          required
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm text-foreground">
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="bg-background"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whyJustOne" className="text-sm text-foreground">
                        Why do you want to work with JustOne?
                      </Label>
                      <Textarea
                        id="whyJustOne"
                        name="whyJustOne"
                        value={formData.whyJustOne}
                        onChange={handleChange}
                        rows={3}
                        required
                        className="bg-background resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">
                        Resume (optional)
                      </Label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                        id="resume-upload"
                      />
                      
                      {!resumeFile ? (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-border rounded-md text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors bg-background"
                        >
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Upload PDF or Word document</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between py-3 px-4 border border-border rounded-md bg-muted/30">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm text-foreground truncate">{resumeFile.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0"
                            aria-label="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      {fileError && (
                        <p className="text-sm text-destructive">{fileError}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Max 5MB • PDF or Word
                      </p>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ApplicationFormModal;
