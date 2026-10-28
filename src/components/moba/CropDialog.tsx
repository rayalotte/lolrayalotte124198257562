import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

async function cropToFile(src: string, area: Area, type: string): Promise<File> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(area.width));
  canvas.height = Math.max(1, Math.round(area.height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Falha ao processar a imagem.");
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92));
  if (!blob) throw new Error("Falha ao processar a imagem.");
  const ext = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  return new File([blob], `recorte.${ext}`, { type });
}

export function CropDialog({
  src,
  aspect,
  title,
  onCancel,
  onDone,
}: {
  src: string;
  aspect: number;
  title: string;
  onCancel: () => void;
  onDone: (file: File) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  const confirm = async () => {
    if (!area) return;
    setBusy(true);
    try {
      const type = src.startsWith("blob:") ? "image/png" : "image/png";
      onDone(await cropToFile(src, area, type));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao cortar a imagem.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative h-[50vh] w-full overflow-hidden border bg-background">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <Slider value={[zoom]} min={1} max={4} step={0.05} onValueChange={([v]) => setZoom(v)} className="flex-1" />
        </div>
        <p className="text-xs text-muted-foreground">Arraste a imagem e ajuste o zoom para escolher o trecho que preenche o espaço no site.</p>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>Cancelar</Button>
          <Button type="button" onClick={confirm} disabled={busy || !area}>{busy ? "Processando…" : "Usar este recorte"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
