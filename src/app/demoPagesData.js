export const demoPages = [
  `<html><body style="background-color: #f0f0f0;"><h1 style="color: #333;">Demo Page 1</h1><p>This is a simple demo page.</p></body></html>`,
  `<html><body style="background-color: #e0e0ff;"><h1 style="color: #0000ff;">Blue Theme</h1><p>A page with a blue theme.</p></body></html>`,
  `<html><body style="background-color: #ffe0e0;"><h1 style="color: #ff0000;">Red Theme</h1><p>A page with a red theme.</p></body></html>`,
  `<html><body style="background-color: #e0ffe0;"><h1 style="color: #00ff00;">Green Theme</h1><p>A page with a green theme.</p></body></html>`,
  `<html><body style="background-color: #fff;"><h1 style="color: #333;">Product Page</h1><div style="border: 1px solid #ddd; padding: 10px; margin: 10px;"><h2>Product Name</h2><p>Description of the product goes here.</p></div></body></html>`,
  `<html><body style="background-color: #f5f5f5;"><h1 style="color: #333;">Blog Post</h1><article style="max-width: 600px; margin: 0 auto;"><h2>Blog Post Title</h2><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p></article></body></html>`,
  `<html><body style="background-color: #000; color: #fff;"><h1>Dark Mode</h1><p>A page with dark mode enabled.</p></body></html>`,
  `<html><body style="background-image: linear-gradient(to right, #ff8a00, #e52e71);"><h1 style="color: #fff;">Gradient Background</h1><p style="color: #fff;">A page with a gradient background.</p></body></html>`,
  `<html><body style="font-family: Arial, sans-serif;"><header style="background-color: #333; color: #fff; padding: 10px;"><h1>Header Example</h1></header><main style="padding: 20px;"><p>Content goes here.</p></main><footer style="background-color: #333; color: #fff; padding: 10px; position: fixed; bottom: 0; width: 100%;">Footer</footer></body></html>`,
  `<html><body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f0f0f0;"><div style="text-align: center;"><h1>Centered Content</h1><p>This page demonstrates centered content.</p></div></body></html>`
];

export default function getDemoPages() {
  return demoPages;
}