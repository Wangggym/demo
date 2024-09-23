import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

function serializeElement(element) {
  return {
    tagName: element.tagName,
    id: element.id,
    className: element.className,
    textContent: element.textContent.trim().substring(0, 50), // Limit text content
    attributes: Array.from(element.attributes).map(attr => ({
      name: attr.name,
      value: attr.value
    }))
  };
}

function serializeDOMTree(node, maxDepth = 3, currentDepth = 0) {
  if (currentDepth > maxDepth) return null;

  const serialized = serializeElement(node);
  serialized.children = Array.from(node.children).map(child =>
    serializeDOMTree(child, maxDepth, currentDepth + 1)
  ).filter(Boolean);

  return serialized;
}

export async function generateHtmlChange(element, bodyContent, changeRequest, elementInfo) {
  const prompt = `
    Given the following HTML element:
    Tag: ${elementInfo.tagName}
    Classes: ${elementInfo.className}
    ID: ${elementInfo.id}
    Current content: ${elementInfo.innerHTML}

    Change request: ${changeRequest}

    Please provide the updated HTML for this element, considering the change request.
    Follow these guidelines:
    1. Use only valid HTML5 tags and attributes.
    2. Use Tailwind CSS classes for styling instead of inline styles.
    3. Ensure color values are using Tailwind's color palette classes.
    4. Maintain the original structure of the element as much as possible.
    5. Only make changes that are directly related to the change request.

    Return only the updated HTML for this element, nothing else. Do not include any explanations or comments.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert HTML and CSS generator. Create updated, valid HTML based on the given element and change request." },
        { role: "user", content: prompt }
      ],
      max_tokens: 500
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating HTML change:', error);
    return null;
  }
}

// Helper function to get the DOM path
function getDomPath(element, bodyElement) {
  const path = [];
  while (element !== bodyElement) {
    let sibling = element;
    let siblingIndex = 1;
    while (sibling = sibling.previousElementSibling) {
      if (sibling.nodeName === element.nodeName) {
        siblingIndex++;
      }
    }
    path.unshift(`${element.nodeName.toLowerCase()}:nth-of-type(${siblingIndex})`);
    element = element.parentNode;
  }
  return path.join(" > ");
}

export async function evaluateHtml(html) {
  const prompt = `
    Evaluate the following HTML based on these criteria:
    1. Visual Appeal: Consider aesthetic coherence, color scheme, typography, and layout balance.
    2. Content Quality: Assess relevance, depth, variety, and organization of information.
    3. User-Friendliness: Evaluate navigation, call-to-actions, design consistency, and mobile-friendliness.
    4. Interactivity: Consider interactive elements, transitions, multimedia content, and social sharing options.
    5. Prompt Fulfillment: Evaluate how well this HTML fulfills the original user prompt, considering completeness, creativity, and unexpected positive additions.

    For each criterion, provide:
    1. A score out of 10
    2. A brief feedback (max 50 words)
    3. One specific suggestion for improvement

    Respond in JSON format:
    {
      "visualAppeal": {
        "score": 0,
        "feedback": "",
        "suggestion": ""
      },
      "contentQuality": {
        "score": 0,
        "feedback": "",
        "suggestion": ""
      },
      "userFriendliness": {
        "score": 0,
        "feedback": "",
        "suggestion": ""
      },
      "interactivity": {
        "score": 0,
        "feedback": "",
        "suggestion": ""
      },
      "promptFulfillment": {
        "score": 0,
        "feedback": "",
        "suggestion": ""
      },
      "overallScore": 0
    }

    HTML to evaluate:
    ${html}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an expert web page evaluator. Provide concise, actionable feedback." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Error evaluating HTML:', error);
    return null;
  }
}

export async function optimizeHtml(html, evaluation) {
  const prompt = `
    You are an expert HTML optimizer. Based on the evaluation feedback, improve the HTML to address the suggestions.

    Original HTML:
    ${html}

    Key Suggestions:
    ${Object.values(evaluation)
      .filter(section => section.suggestion)
      .map(section => `- ${section.suggestion}`)
      .join('\n')}

    Guidelines:
    1. Focus on the suggestions provided.
    2. Maintain the core structure and purpose of the HTML.
    3. Use Tailwind CSS classes appropriately.
    4. Ensure the HTML is complete and valid.

    Provide only the optimized HTML, without any explanations or markdown formatting.
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4", // Updated model
      messages: [
        { role: "system", content: "You are an expert HTML optimizer." },
        { role: "user", content: prompt }
      ],
      max_tokens: 4096
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error optimizing HTML:', error);
    return null;
  }
}

// Modified generateHtml function to include evaluation and optimization
export async function generateHtml(prompt) {
  const enhancedPrompt = `
    You are an expert HTML and Tailwind CSS developer. Create a complete, valid, and well-structured HTML page based on the user's request.
    Implement clean, efficient styling using Tailwind CSS classes for layout, typography, colors, and other design aspects.
    
    Important guidelines:
    1. Create a full-screen layout that utilizes the entire viewport.
    2. Use Tailwind's min-h-screen class on the body or main container to ensure full height.
    3. Implement responsive design to maintain full-screen appearance on various devices.
    4. Utilize Tailwind's flex or grid classes for efficient layout structuring.
    5. Ensure proper padding and margins to avoid content touching screen edges.
    6. Structure the page using semantic HTML5 tags, specifically:
       - Use <header> for the top section of the page
       - Use <main> for the primary content area
       - Use <footer> for the bottom section of the page
    7. Implement a sticky footer if appropriate for the design.
    
    Return only the complete HTML content, without any explanations or markdown formatting.
    Include the necessary Tailwind CSS CDN link in the <head> section.

    User's request: ${prompt}
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: enhancedPrompt },
        { role: "user", content: "Generate the HTML based on the above guidelines." }
      ],
      max_tokens: 4096
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating HTML:', error);
    return null;
  }
}