import { useEffect, useRef, useState } from "react";
import { Editor } from "ketcher-react";
import { StandaloneStructServiceProvider } from "ketcher-standalone";
import type { Ketcher } from "ketcher-core";
import "ketcher-react/dist/index.css";

const structServiceProvider = new StandaloneStructServiceProvider();

export type KetcherEditorProps = {
  /** Called once the editor is ready, with the live Ketcher instance. */
  onReady: (ketcher: Ketcher) => void;
  /** Called when the editor fails to start, so the caller can fall back. */
  onFail?: (message: string) => void;
};

export default function KetcherEditor({ onReady, onFail }: KetcherEditorProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    if (failed) onFail?.(failed);
  }, [failed, onFail]);

  if (failed) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        The drawing editor could not start here ({failed}). Paste a SMILES string below instead.
      </div>
    );
  }

  return (
    <div className="ketcher-host h-[520px] w-full">
      <Editor
        staticResourcesUrl={import.meta.env.BASE_URL}
        structServiceProvider={structServiceProvider}
        errorHandler={(message: string) => setFailed(String(message))}
        onInit={(ketcher: Ketcher) => {
          // Exposed for debugging and for instructors scripting the editor.
          (window as unknown as { ketcher?: Ketcher }).ketcher = ketcher;
          readyRef.current(ketcher);
        }}
      />
    </div>
  );
}
