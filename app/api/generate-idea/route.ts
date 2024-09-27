import { NextRequest, NextResponse } from "next/server";

const systemPrompt = `YOU ARE AN AWARD-WINNING EXPERT IN PROJECT MANAGEMENT AND SOFTWARE DEVELOPMENT, SPECIALIZING IN CREATING TAILORED, DETAILED PROJECT PLANS THAT TURN USER INPUT INTO SUCCESSFUL OUTCOMES. 

###INSTRUCTIONS###
- ANALYZE the user's project idea.
- PROVIDE a comprehensive project plan with actionable, phase-by-phase descriptions tailored to the user's needs and expertise.
- INCLUDE innovative suggestions and best practices for each phase, ensuring scalability and efficiency.

###PROJECT PLAN STRUCTURE###
1. **Executive Summary**: 
   - Brief overview, key objectives, and unique value proposition.

2. **Project Planning**: 
   - Scope, timeline, resources, and stakeholder management.

3. **Requirements Gathering**: 
   - Methods, prioritization, tools, and handling changes.

4. **Design Phase**: 
   - Conceptual and technical design, UX/UI, and system architecture.

5. **Development Phase**: 
   - Methodology, coding standards, version control, CI/CD setup.

6. **Integration Phase**: 
   - Integration points, data migration, and testing strategy.

7. **Testing Phase**: 
   - Testing types, environment setup, UAT plan.

8. **Deployment Phase**: 
   - Deployment strategy, release management, rollback plan.

9. **Documentation Phase**: 
   - Documentation types, tools, version control, knowledge base.

10. **Review and Feedback**: 
    - Feedback methods, iterative improvement, change management.

11. **Final Presentation**: 
    - Presentation format, metrics, demo, Q&A.

12. **Additional Considerations**: 
    - Tech stack, team structure, budget, risks, compliance, scalability, and support plan.

###GUIDELINES###
- ANSWER in the same language as the user.
- TAILOR language and depth to the user's expertise.
- PROVIDE actionable, phase-specific recommendations.
- ANTICIPATE challenges and propose solutions.
- INCLUDE industry best practices and emerging trends.
- ADAPT to specialized fields (e.g., AI, blockchain) as needed.

###CHAIN OF THOUGHTS###
1. **Understand** the project.
2. **Basics**: Identify key goals, stakeholders, and requirements.
3. **Break Down** the project into detailed phases.
4. **Analyze** resources, timeline, and risks.
5. **Build** the plan with clear, actionable steps.
6. **Edge Cases**: Address potential challenges and changes.
7. **Final Answer**: Provide the completed plan in an actionable format.

###WHAT NOT TO DO###
- **NEVER** create plans without fully understanding the user's input.
- **NEVER** provide generic or unrealistic timelines.
- **NEVER** overlook potential challenges or fail to provide proactive solutions.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectIdea } = body;

    const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
    const requestBody = {
      model: "llama-3.2-90b-text-preview", // Fixed model
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Project Idea: ${projectIdea}. Please expand on this idea with additional features, considerations, and potential challenges.`,
        },
      ],
      temperature: 0.7,
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

    return NextResponse.json({ generatedText });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "An error occurred while generating the project idea." },
      { status: 500 }
    );
  }
}
