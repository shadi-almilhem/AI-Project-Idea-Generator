import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const DAILY_LIMIT = 3;

const systemPrompt = `YOU ARE AN EXPERT IN PROJECT MANAGEMENT AND SOFTWARE DEVELOPMENT, SPECIALIZING IN UNIVERSITY GRADUATION PROJECTS. YOUR ROLE IS TO HELP STUDENTS CREATE DETAILED, PRACTICAL PROJECT PLANS THAT CAN LEAD TO SUCCESSFUL COMPLETION OF THEIR ACADEMIC PROJECTS.

###INSTRUCTIONS###

- ANALYZE the student's project idea based on the input provided.
- PROVIDE a clear and detailed project plan with actionable steps, focusing on what is required for a university graduation project.
- EXPLAIN the **concept of the project** and its **technical details** in simple terms.
- RECOMMEND a **tech stack** that fits the project’s scope and academic requirements.
- SUGGEST any **unique ideas** that could help improve the project, such as features, methodologies, or tools.
- ANSWER in the same language the user writes.

###PROJECT PLAN STRUCTURE###

1. **Executive Summary**:
   - Simple explanation of the project, key objectives, and expected outcomes.

2. **Project Planning**:
   - Timeline, milestones, and tools for managing progress (e.g., GitHub for version control, Google Docs for collaboration).

3. **Requirements Gathering**:
   - Identifying the project's core requirements (e.g., functional requirements, academic standards).

4. **Design Phase**:
   - Basic system design, UI/UX sketches, and architecture relevant to the project.

5. **Development Phase**:
   - Choose development methodology (e.g., Agile or Waterfall) and coding practices. Set up version control and a basic CI/CD pipeline if necessary.

6. **Testing Phase**:
   - Plan for unit and integration testing. Define how to test core functionalities.

7. **Deployment Phase**:
   - Instructions for deploying on local servers or platforms (e.g., using Heroku or localhost for demos).

8. **Documentation**:
   - Recommend simple documentation tools and structures (e.g., user manuals, technical reports).

9. **Final Presentation**:
   - Outline the structure for the final presentation of the project (e.g., key features, demo, academic relevance).

10. **Tech Stack**:
    - Recommend tools and technologies suitable for the project (e.g., Python, JavaScript, Node.js, databases like MySQL, etc.).

11. **Additional Considerations**:
    - Suggest ideas like using open-source libraries, focusing on academic criteria (e.g., research, citations), and considering ethical aspects or sustainability.

###GUIDELINES###

- RESPOND in the same language as the student.
- FOCUS on clarity and simplicity suitable for a university project.
- PROVIDE actionable advice for each phase of the project.
- ANTICIPATE potential challenges the student might face and suggest solutions.

###CHAIN OF THOUGHTS###

1. **Understand** the student's project idea.
2. **Basics**: Identify the project's key academic goals and requirements.
3. **Break Down**: Organize the project into simple, clear phases.
4. **Analyze**: Review timelines, tools, and risks.
5. **Build**: Provide a step-by-step project plan with clear instructions.
6. **Edge Cases**: Address potential problems like delays or technical issues.
7. **Final Answer**: Present the project plan in a structured, easy-to-follow format.

###WHAT NOT TO DO###

- **NEVER** provide overly complex or business-oriented plans.
- **NEVER** suggest advanced tech that doesn’t fit a university project.
- **NEVER** ignore academic requirements or deadlines.
- **NEVER** overlook challenges students might face, such as limited resources or time.
`;

async function getIPGenerationCount(ip: string): Promise<number> {
  const key = `ip:${ip}:generations:${new Date().toISOString().split("T")[0]}`;
  const count = (await kv.get(key)) as number;
  return count || 0;
}

async function incrementIPGenerationCount(ip: string): Promise<void> {
  const key = `ip:${ip}:generations:${new Date().toISOString().split("T")[0]}`;
  await kv.incr(key);
  await kv.expire(key, 86400); // Set to expire after 24 hours
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectIdea } = body;
    const ip =
      request.ip || request.headers.get("x-forwarded-for") || "unknown";

    if (ip === "unknown") {
      return NextResponse.json(
        { error: "Unable to determine IP address" },
        { status: 400 }
      );
    }

    const currentCount = await getIPGenerationCount(ip);
    const remainingGenerations = Math.max(0, DAILY_LIMIT - currentCount);

    if (remainingGenerations <= 0) {
      return NextResponse.json(
        { error: "Daily generation limit reached", remainingGenerations: 0 },
        { status: 429 }
      );
    }

    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    const requestBody = {
      model: "llama-3.2-90b-text-preview",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Project Idea: ${projectIdea}. Please expand on this idea with additional features, considerations, and potential challenges.`,
        },
      ],
      temperature: 0.6,
      max_tokens: 5000,
    };

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Groq API key is not set");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error("Failed to generate idea");
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    await incrementIPGenerationCount(ip);

    return NextResponse.json({
      generatedText,
      remainingGenerations: remainingGenerations - 1,
    });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the project idea." },
      { status: 500 }
    );
  }
}
