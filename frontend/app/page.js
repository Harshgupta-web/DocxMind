// 'use client';
// import { useState } from 'react';
// import FileUpload from './components/FileUpload';
// import ChatWindow from './components/ChatWindow';
// import Sidebar from './components/Sidebar';

// export default function Home() {
//   const [activeDocId, setActiveDocId] = useState(null);
//   const [docs, setDocs] = useState({});

//   const handleUploadSuccess = (docId, fileName) => {
//     setDocs((prev) => ({
//       ...prev,
//       [docId]: { name: fileName, messages: [], sources: [] },
//     }));
//     setActiveDocId(docId);
//   };

//   const updateDocChat = (docId, messages, sources) => {
//     setDocs((prev) => ({
//       ...prev,
//       [docId]: {
//         ...prev[docId],
//         messages,
//         sources,
//       },
//     }));
//   };

//   return (
//     <div className="h-screen overflow-hidden bg-[#0b0b0b] text-white">
//       <div className="flex h-full w-full">
//         <Sidebar
//           docs={docs}
//           activeDocId={activeDocId}
//           onSelect={setActiveDocId}
//           onUpload={() => setActiveDocId(null)}
//         />

//         <main className="flex min-w-0 flex-1 flex-col bg-[#0b0b0b]">
//           {!activeDocId ? (
//             <FileUpload onUploadSuccess={handleUploadSuccess} />
//           ) : (
//             <ChatWindow
//               key={activeDocId}
//               docId={activeDocId}
//               docName={docs[activeDocId]?.name}
//               initialMessages={docs[activeDocId]?.messages || []}
//               initialSources={docs[activeDocId]?.sources || []}
//               onChatUpdate={(messages, sources) =>
//                 updateDocChat(activeDocId, messages, sources)
//               }
//             />
//           )}
//         </main>
//       </div>
//     </div>
//   );
// }


'use client';
import { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';

export default function Home() {
  const [activeDocId, setActiveDocId] = useState(null);
  const [docs, setDocs] = useState({});

  const handleUploadSuccess = useCallback((docId, fileName) => {
    setDocs((prev) => ({
      ...prev,
      [docId]: { name: fileName, messages: [], sources: [] },
    }));
    setActiveDocId(docId);
  }, []);

  const updateDocChat = useCallback((docId, messages, sources) => {
    setDocs((prev) => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        messages,
        sources,
      },
    }));
  }, []);

  const handleChatUpdate = useCallback((messages, sources) => {
    if (!activeDocId) return;
    updateDocChat(activeDocId, messages, sources);
  }, [activeDocId, updateDocChat]);

  return (
    <div className="h-screen overflow-hidden bg-[#0b0b0b] text-white">
      <div className="flex h-full w-full">
        <Sidebar
          docs={docs}
          activeDocId={activeDocId}
          onSelect={setActiveDocId}
          onUpload={() => setActiveDocId(null)}
        />

        <main className="flex min-w-0 flex-1 flex-col bg-[#0b0b0b]">
          {!activeDocId ? (
            <FileUpload onUploadSuccess={handleUploadSuccess} />
          ) : (
            <ChatWindow
              key={activeDocId}
              docId={activeDocId}
              docName={docs[activeDocId]?.name}
              initialMessages={docs[activeDocId]?.messages || []}
              initialSources={docs[activeDocId]?.sources || []}
              onChatUpdate={handleChatUpdate}
            />
          )}
        </main>
      </div>
    </div>
  );
}