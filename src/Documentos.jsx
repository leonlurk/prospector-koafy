import React from 'react';

// Replace with your actual YouTube video IDs
const videoIds = [
  'VIDEO_ID_1', // Replace with your first video ID
  'VIDEO_ID_2', // Replace with your second video ID
  'VIDEO_ID_3', // Replace with your third video ID
  'VIDEO_ID_4', // Replace with your fourth video ID
];

const Documentos = () => {
  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-gray-100 text-gray-800">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-900">Documentación y Tutoriales</h1>
      
      <p className="mb-8 text-gray-600">
        Aquí encontrarás videos útiles para sacar el máximo provecho de la plataforma.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {videoIds.map((videoId, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-w-16 aspect-h-9">
              {videoId.startsWith('VIDEO_ID_') ? (
                <div className="flex items-center justify-center h-full bg-gray-200 text-gray-500">
                  Video {index + 1} (Reemplaza ID)
                </div>
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={`Video Tutorial ${index + 1}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-2">Video Tutorial {index + 1}</h3>
              {/* You can add descriptions for each video here if needed */}
              <p className="text-sm text-gray-500">Descripción breve del video {index + 1}.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Documentos; 