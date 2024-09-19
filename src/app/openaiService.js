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