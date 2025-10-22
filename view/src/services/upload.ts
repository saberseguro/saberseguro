import { ref, uploadBytesResumable, getDownloadURL, uploadString } from "firebase/storage";
import { storage } from "./firebase";

export function uploadMaterialArquivo(
  file: File,
  opts?: { cursoId?: number | string; aulaId?: number | string; pasta?: string; onProgress?: (pct: number) => void }
): Promise<{ url: string; path: string }> {
  const pasta = opts?.pasta ?? "materiais";
  const curso = opts?.cursoId ?? "curso";
  const aula = opts?.aulaId ?? "aula";
  const safeName = file.name.replace(/\s+/g, "_");
  const path = `${pasta}/${curso}/${aula}/${Date.now()}_${safeName}`;

  const fileRef = ref(storage, path);
  const task = uploadBytesResumable(fileRef, file);

  return new Promise((resolve, reject) => {
    task.on(
      "state_changed",
      (snap) => {
        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
        opts?.onProgress?.(pct);
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, path });
      }
    );
  });
}

export async function uploadAssinaturaResponsavel(base64: string, idResponsavel: number | string): Promise<string> {
  const storageRef = ref(storage, `assinaturas/responsaveis/${idResponsavel}/assinatura.png`);
  await uploadString(storageRef, base64, "data_url");
  const url = await getDownloadURL(storageRef);
  return url;
}

export async function uploadAssinaturaUsuario(base64: string, idUsuario: number | string): Promise<string> {
  const storageRef = ref(storage, `assinaturas/usuarios/${idUsuario}/assinatura.png`);
  await uploadString(storageRef, base64, "data_url");
  const url = await getDownloadURL(storageRef);
  return url;
}