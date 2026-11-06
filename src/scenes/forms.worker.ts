import { buildForms, type Form } from "./geometry";

// Generating every form is the heaviest single job in the experience, so it never touches the main thread.
const forms = buildForms();
const buffers = new Set<ArrayBuffer>();
(Object.values(forms) as Form[]).forEach((form) => {
  Object.values(form).forEach((view) => buffers.add((view as ArrayBufferView).buffer as ArrayBuffer));
});
(self as unknown as Worker).postMessage(forms, [...buffers]);
