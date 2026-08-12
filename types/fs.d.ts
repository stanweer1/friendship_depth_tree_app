interface Window {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  FaceDetector?: new (options?: {
    fastMode?: boolean;
    maxDetectedFaces?: number;
  }) => {
    detect: (image: ImageBitmapSource) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
  };
}

interface FileSystemDirectoryHandle {
  values?: () => AsyncIterable<FileSystemHandle>;
}
