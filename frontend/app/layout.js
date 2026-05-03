import './globals.css';

export const metadata = {
  title: 'DocuMind — Private Document Chatbot',
  description: 'Upload any document. Ask anything. Get answers with sources.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}