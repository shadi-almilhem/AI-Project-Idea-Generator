"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, Sparkles, Trash2, Copy } from "lucide-react";
import toast from "react-hot-toast";

const AIProjectIdeaGenerator = () => {
  const [projectIdea, setProjectIdea] = useState("");
  const [generatedIdea, setGeneratedIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectIdea }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate idea");
      }

      const data = await response.json();
      setGeneratedIdea(data.generatedText);

      toast.success("Idea Generated", {
        duration: 2000,
        position: "top-center",

        // Styling

        // Custom Icon
        icon: "✅",

        // Change colors of success/error/loading icon
      });
    } catch (error) {
      console.error("Error generating project idea:", error);
      setGeneratedIdea(
        "An error occurred while generating the project idea. Please try again."
      );

      toast.error("Failed to generate idea. Please try again.", {
        duration: 4000,
        position: "top-center",

        // Styling

        // Custom Icon
        icon: "❌",

        // Change colors of success/error/loading icon
        iconTheme: {
          primary: "#000",
          secondary: "#fff",
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [projectIdea]);

  const handleClear = useCallback(() => {
    setProjectIdea("");
    setGeneratedIdea("");
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedIdea);

    toast("Generated idea copied to clipboard!", {
      duration: 4000,
      position: "top-center",

      // Styling

      // Custom Icon
      icon: "📝",

      // Change colors of success/error/loading icon
      iconTheme: {
        primary: "#000",
        secondary: "#fff",
      },
    });
  }, [generatedIdea]);

  const formatText = (text: string) => {
    // Replace **text** with <strong>text</strong>
    const formattedText = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return formattedText;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">AI Project Idea Generator</CardTitle>
        <CardDescription>
          Enter your project idea and let AI expand on it
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Enter your project idea (in Arabic or English)"
          value={projectIdea}
          onChange={(e) => setProjectIdea(e.target.value)}
          className="mb-4 min-h-[100px]"
        />
        <div className="flex space-x-2">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !projectIdea}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Idea
              </>
            )}
          </Button>
          <Button
            onClick={handleClear}
            variant="outline"
            disabled={isLoading || (!projectIdea && !generatedIdea)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardContent>
      {generatedIdea && (
        <CardFooter className="flex flex-col items-start">
          <div className="mt-4 w-full">
            <h3 className="font-bold mb-2 text-lg">Generated Idea:</h3>
            <div
              className="w-full h-[200px]  mb-4 p-2 border rounded overflow-y-scroll"
              style={{ whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{ __html: formatText(generatedIdea) }}
            />
            <div className="flex space-x-2">
              <Button onClick={handleCopy} variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default AIProjectIdeaGenerator;
