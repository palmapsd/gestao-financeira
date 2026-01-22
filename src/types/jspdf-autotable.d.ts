declare module 'jspdf-autotable' {
    import { jsPDF } from 'jspdf';

    interface AutoTableOptions {
        startY?: number;
        head?: (string | number)[][];
        body?: (string | number)[][];
        foot?: (string | number)[][];
        theme?: 'striped' | 'grid' | 'plain';
        headStyles?: {
            fillColor?: [number, number, number];
            textColor?: [number, number, number];
            fontStyle?: string;
            fontSize?: number;
            halign?: 'left' | 'center' | 'right';
        };
        bodyStyles?: {
            fillColor?: [number, number, number];
            textColor?: [number, number, number];
            fontSize?: number;
        };
        footStyles?: {
            fillColor?: [number, number, number];
            textColor?: [number, number, number];
            fontStyle?: string;
            fontSize?: number;
        };
        columnStyles?: {
            [key: number]: {
                cellWidth?: number;
                halign?: 'left' | 'center' | 'right';
            };
        };
        margin?: {
            left?: number;
            right?: number;
            top?: number;
            bottom?: number;
        };
        didParseCell?: (data: {
            section: 'head' | 'body' | 'foot';
            column: { index: number };
            cell: {
                styles: {
                    textColor?: [number, number, number];
                    fontStyle?: string;
                };
            };
        }) => void;
    }

    function autoTable(doc: jsPDF, options: AutoTableOptions): void;

    export default autoTable;
}
