import { buildForms, type Form, type FormId } from "./geometry";

let pending: Promise<Record<FormId, Form>> | null = null;

/** Built once off the main thread, with a direct fallback where a worker cannot start. */
export function loadForms(): Promise<Record<FormId, Form>> {
  pending ??= new Promise((resolve) => {
    try {
      const worker = new Worker(new URL("./forms.worker.ts", import.meta.url));
      worker.onmessage = (e: MessageEvent<Record<FormId, Form>>) => {
        worker.terminate();
        resolve(e.data);
      };
      worker.onerror = () => {
        worker.terminate();
        resolve(buildForms());
      };
    } catch {
      resolve(buildForms());
    }
  });
  return pending;
}
