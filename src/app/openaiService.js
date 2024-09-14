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

export async function generateHtmlChange(selectedElement, domTree, userInput) {
  const serializedSelected = serializeElement(selectedElement);
  const serializedTree = serializeDOMTree(domTree);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an HTML editor. Modify the given HTML based on the user's request." },
        { role: "user", content: `
          Selected element: ${JSON.stringify(serializedSelected, null, 2)}
          DOM tree: ${JSON.stringify(serializedTree, null, 2)}
          User request: ${userInput}
          
          Please provide the updated HTML for the entire page, incorporating the user's requested changes.
          Return only the HTML content, without any explanations or markdown formatting.
        `}
      ],
      max_tokens: 1000
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating HTML change:', error);
    return null;
  }
}

export async function generateHtml(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an HTML generator. Create a simple HTML page based on the user's prompt. Return only the HTML content, without any explanations or markdown formatting." },
        { role: "user", content: prompt }
      ],
      max_tokens: 1000
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating HTML:', error);
    return null;
  }
}