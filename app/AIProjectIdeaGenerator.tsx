"use client";
import React, { useState, useCallback, useEffect } from "react";
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
import Link from "next/link";

const AIProjectIdeaGenerator = () => {
  const [projectIdea, setProjectIdea] = useState("");
  const [generatedIdea, setGeneratedIdea] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [remainingGenerations, setRemainingGenerations] = useState(3);

  const fetchRemainingGenerations = useCallback(async () => {
    try {
      const response = await fetch("/api/check-limit", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch remaining generations");
      }

      const data = await response.json();
      setRemainingGenerations(data.remainingGenerations);
    } catch (error) {
      console.error("Error fetching remaining generations:", error);
      toast.error("Failed to fetch remaining generations. Please try again.");
    }
  }, []);

  useEffect(() => {
    fetchRemainingGenerations();
  }, [fetchRemainingGenerations]);

  const handleSubmit = useCallback(async () => {
    if (remainingGenerations <= 0) {
      toast.error("Daily generation limit reached. Please try again tomorrow.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-idea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectIdea }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate idea");
      }

      setGeneratedIdea(data.generatedText);
      setRemainingGenerations(data.remainingGenerations);

      toast.success(
        `Idea Generated. ${data.remainingGenerations} generations left today.`,
        {
          duration: 2000,
          position: "top-center",
          icon: "✅",
        }
      );
    } catch (error) {
      console.error("Error generating project idea:", error);
      setGeneratedIdea(
        "An error occurred while generating the project idea. Please try again."
      );

      toast.error(
        error.message || "Failed to generate idea. Please try again.",
        {
          duration: 4000,
          position: "top-center",
          icon: "❌",
        }
      );

      // If the error is due to reaching the generation limit, update the remaining generations
      if (error.message === "Daily generation limit reached") {
        setRemainingGenerations(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [projectIdea, remainingGenerations]);

  const handleClear = useCallback(() => {
    setProjectIdea("");
    setGeneratedIdea("");
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(generatedIdea);
    toast("Generated idea copied to clipboard!", {
      duration: 4000,
      position: "top-center",
      icon: "📝",
    });
  }, [generatedIdea]);

  const formatText = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
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
            disabled={isLoading || !projectIdea || remainingGenerations <= 0}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : remainingGenerations <= 0 ? (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                No generations left today
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Idea ({remainingGenerations} left)
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
              className="w-full h-[200px] mb-4 p-2 border rounded overflow-y-scroll"
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
      <CardDescription className="mx-auto p-6 pt-0">
        Made By{" "}
        <Link
          className="text-black font-semibold"
          href="https://shadialmilhem.com"
        >
          Shadi Al Milhem
        </Link>
      </CardDescription>
    </Card>
  );
};

export default AIProjectIdeaGenerator;
