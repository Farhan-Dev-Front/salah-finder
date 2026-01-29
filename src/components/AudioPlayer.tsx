type Props = { audioUrl: string | null; onStop: () => void };

export default function AudioPlayer({ audioUrl, onStop }: Props) {
  if (!audioUrl) return null;
  return (
    <div className="fixed bottom-25 left-1/2 transform -translate-x-1/2 bg-white/90 border rounded-lg p-3 shadow-lg w-[90%] max-w-lg">
      <div className="flex items-center justify-between">
        <div className="text-sm">Audio</div>
        <button onClick={onStop} className="px-3 py-1 border rounded">Stop</button>
      </div>
      <audio src={audioUrl} controls autoPlay className="w-full mt-2" />
    </div>
  );
}
