import { jsPDF } from "jspdf";
import JsBarcode from "jsbarcode";

export interface PdfLayoutConfig {
    margin: number;
    boxGap: number;
    primaryColor: [number, number, number];
    secondaryColor: [number, number, number];
    font: string;
    pageWidth: number;
    pageHeight: number;
}

export const generateBarcode = (text: string): string => {
    const canvas = document.createElement("canvas");
    JsBarcode(canvas, text, {
        format: "CODE128",
        displayValue: false,
        height: 30,
        width: 1,
        margin: 0
    });
    return canvas.toDataURL("image/png");
};

export const loadImageAsDataURL = (src: string): Promise<{ data: string; width: number; height: number } | null> =>
    new Promise((resolve) => {
        if (!src) return resolve(null);
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            try {
                const c = document.createElement("canvas");
                c.width = img.width;
                c.height = img.height;
                const ctx = c.getContext("2d");
                if (!ctx) return resolve(null);
                ctx.drawImage(img, 0, 0);
                resolve({
                    data: c.toDataURL("image/png"),
                    width: img.width,
                    height: img.height
                });
            } catch (e) {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });

export const drawBox = (doc: jsPDF, x: number, y: number, w: number, h: number, config: PdfLayoutConfig, title?: string) => {
    // Light border color for a modern feel
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.1);
    doc.rect(x, y, w, h);

    if (title) {
        // Subtle background for the box header
        doc.setFillColor(248, 250, 252); // Slate 50
        doc.rect(x, y, w, 7, "F");

        // Bottom border for the header title area
        doc.setDrawColor(226, 232, 240);
        doc.line(x, y + 7, x + w, y + 7);

        doc.setFont(config.font, "bold");
        doc.setFontSize(8.5);
        // Use primary color for titles
        doc.setTextColor(config.primaryColor[0], config.primaryColor[1], config.primaryColor[2]);
        doc.text(title, x + 3, y + 5);
    }
};

export const drawWatermark = (doc: jsPDF, text: string, config: PdfLayoutConfig) => {
    doc.saveGraphicsState();
    const gState = (doc as any).GState ? new (doc as any).GState({ opacity: 0.1 }) : { opacity: 0.1 };
    doc.setGState(gState);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(60);
    doc.setFont(config.font, "bold");
    const cx = config.pageWidth / 2;
    const cy = config.pageHeight / 2;
    doc.text(text, cx, cy, { align: "center", angle: 45 });
    doc.restoreGraphicsState();
};
