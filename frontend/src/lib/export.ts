import type { HistoryEntry } from "@/lib/history";

export async function exportPdf(
  entry: HistoryEntry,
  element: HTMLElement,
): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  // Clone the node into an off-screen, unconstrained wrapper before capturing.
  // Capturing `element` in place is unreliable once its content is taller than
  // the viewport: it sits inside an `overflow-y-auto` panel, and html2canvas
  // only reliably renders what's within the current scroll position, leaving
  // scrolled-out text blank in the canvas. A full-height clone with no
  // scroll/height constraints avoids that.
  const clone = element.cloneNode(true) as HTMLElement;
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.top = "0";
  wrapper.style.left = "-99999px";
  wrapper.style.width = `${element.offsetWidth}px`;
  wrapper.style.background = "#ffffff";
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      width: element.offsetWidth,
      windowWidth: element.offsetWidth,
      windowHeight: clone.scrollHeight,
    });
  } finally {
    document.body.removeChild(wrapper);
  }

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const imgWidth = contentWidth;
  const pxPerPt = canvas.width / imgWidth;
  const pageHeightInCanvasPx = contentHeight * pxPerPt;

  let renderedPx = 0;
  let pageIndex = 0;

  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(
      pageHeightInCanvasPx,
      canvas.height - renderedPx,
    );

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) break;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(
      canvas,
      0,
      renderedPx,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx,
    );

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(
      pageCanvas.toDataURL("image/png"),
      "PNG",
      margin,
      margin,
      imgWidth,
      sliceHeightPx / pxPerPt,
    );

    renderedPx += sliceHeightPx;
    pageIndex += 1;
  }

  pdf.save(
    `${slugify(entry.question)}-${formatStamp(new Date(entry.createdAt))}.pdf`,
  );
}

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
  return slug || "research-report";
}

function formatStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
}
