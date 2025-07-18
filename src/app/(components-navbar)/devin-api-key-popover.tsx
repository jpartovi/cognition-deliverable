"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export function DevinApiKeyPopover() {
  const [apiKey, setApiKey] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? sessionStorage.getItem("devinApiKey") : null;
    if (stored) {
      setApiKey(stored);
      setInputValue(stored);
    }
  }, []);

  const handleSave = () => {
    sessionStorage.setItem("devinApiKey", inputValue);
    setApiKey(inputValue);
    setOpen(false);
  };

  const handleCancel = () => {
    setInputValue(apiKey);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={apiKey ? "secondary" : "default"}
          size="sm"
          className="ml-2"
          type="button"
        >
          Devin API Key
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <label className="block text-xs mb-2 font-medium">Devin API Key</label>
        <input
          type="text"
          className="w-full border rounded px-2 py-1 text-sm mb-2 bg-background"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="apk_user_..."
          autoFocus
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCancel}
            type="button"
          >Cancel</Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            type="button"
            disabled={!inputValue}
          >Save</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 