import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";

const CreatePoll = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [creating, setCreating] = useState(false);

  const addOption = () => {
    if (options.length < 10) setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleCreate = async () => {
    const trimmedQuestion = question.trim();
    const trimmedOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);

    if (!trimmedQuestion) {
      toast.error("Please enter a question");
      return;
    }
    if (trimmedOptions.length < 2) {
      toast.error("Add at least 2 options");
      return;
    }
    if (new Set(trimmedOptions).size !== trimmedOptions.length) {
      toast.error("Options must be unique");
      return;
    }

    setCreating(true);
    try {
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({ question: trimmedQuestion })
        .select()
        .single();

      if (pollError) throw pollError;

      const optionRows = trimmedOptions.map((label, i) => ({
        poll_id: poll.id,
        label,
        position: i,
      }));

      const { error: optError } = await supabase
        .from("poll_options")
        .insert(optionRows);

      if (optError) throw optError;

      navigate(`/poll/${poll.id}`);
    } catch (err) {
      toast.error("Failed to create poll");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
              QuickPoll
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create a poll in seconds. Share. Get real-time results.
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-5">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Your Question
            </label>
            <Input
              placeholder="What should we have for lunch?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={200}
              className="text-base"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Options
            </label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(i, e.target.value)}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(i)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={addOption}
                className="mt-2 text-muted-foreground"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add option
              </Button>
            )}
          </div>

          <Button
            onClick={handleCreate}
            disabled={creating}
            className="w-full font-semibold"
            size="lg"
          >
            {creating ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreatePoll;
