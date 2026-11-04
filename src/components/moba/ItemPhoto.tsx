import { useRef, useState } from "react";
import { ImagePlus, Trash2, RefreshCw, Crop } from "lucide-react";
import { MAX_BYTES, validateImage } from "@/lib/moba";
import { Button } from "@/components/ui/button";
import { MediaImage } from "./MediaImage";
import { CropDialog } from "./CropDialog";
export type Img = { path: string | null; file: File | null; preview: string | null; orig: string | null };
export const img = (path: string | null): Img => ({ path, file: null, preview: null, orig: null });
/* ---------- compact photo for list rows (items) ---------- */
export function ItemPhoto({ value, onChange }: { value: Img; onChange: (v: Img | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const pick = (f?: File) => {
    if (!f) return;
    const e = validateImage(f);
    if (e) { setErr(e); return; }
    setErr(null);
    setCropSrc(URL.createObjectURL(f));
  };
  const applyCrop = (file: File) => {
    if (file.size > MAX_BYTES) { setErr("O recorte ficou grande demais (máximo 8 MB). Tente um zoom maior ou outra imagem."); cancelCrop(); return; }
    if (value.preview) URL.revokeObjectURL(value.preview);
    if (value.orig && value.orig !== cropSrc) URL.revokeObjectURL(value.orig);
    onChange({ path: null, file, preview: URL.createObjectURL(file), orig: cropSrc });
    setCropSrc(null);
  };
  const cancelCrop = () => {
    if (cropSrc && cropSrc !== value.orig) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };
  return (
    <div className="w-16 shrink-0">
      <Button type="button" variant="ghost" onClick={() => ref.current?.click()} title="Foto do item"
        className="relative flex size-16 items-center justify-center overflow-hidden border border-dashed bg-panel-raised text-muted-foreground transition-colors hover:border-primary/60">
        {value.preview ? <img src={value.preview} alt="" className="size-full object-cover" />
          : value.path ? <MediaImage path={value.path} alt="" className="size-full object-cover" />
          : <ImagePlus className="size-4" />}
        {value.file && <span className="absolute inset-x-0 bottom-0 bg-primary text-center text-[9px] text-primary-foreground">não salva</span>}
      </Button>
      {(value.preview || value.path) && (
        <div className="mt-1 flex justify-center gap-0.5">
          <Button type="button" size="sm" variant="ghost" className="h-6 px-1.5" title="Trocar" onClick={() => ref.current?.click()}><RefreshCw className="size-3" /></Button>
          {value.orig && <Button type="button" size="sm" variant="ghost" className="h-6 px-1.5" title="Recortar" onClick={() => setCropSrc(value.orig)}><Crop className="size-3" /></Button>}
          <Button type="button" size="sm" variant="ghost" className="h-6 px-1.5" title="Remover" onClick={() => onChange(null)}><Trash2 className="size-3" /></Button>
        </div>
      )}
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      {err && <p className="mt-1 text-[10px] text-destructive">{err}</p>}
      {cropSrc && <CropDialog src={cropSrc} aspect={1} title="Recortar — foto do item" onCancel={cancelCrop} onDone={applyCrop} />}
    </div>
  );
}

