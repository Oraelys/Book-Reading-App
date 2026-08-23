// import { Injectable } from '@nestjs/common';

// import * as fs from 'fs/promises';

// import * as pdfjs from 'pdfjs-dist';

// import { ContentParser } from './parser.interface';
// import { ParsedDocument } from '../../interfaces/document.interface';

// @Injectable()
// export class PdfParserService
// implements ContentParser {

//     async parse(
//         file: string,
//     ): Promise<ParsedDocument> {

//         const buffer =
//             await fs.readFile(file);

//         const loadingTask =
//             pdfjs.getDocument({
//                 data: new Uint8Array(buffer),
//             });

//         const pdf =
//             await loadingTask.promise;

//         let text = '';

//         for (
//             let pageNumber = 1;
//             pageNumber <= pdf.numPages;
//             pageNumber++
//         ) {

//             const page =
//                 await pdf.getPage(pageNumber);

//             const content =
//                 await page.getTextContent();

//             const pageText =
//                 content.items
//                     .map((item: any) => item.str)
//                     .join(' ');

//             text +=
//                 pageText + '\n\n';

//         }

//         return {

//             chapters: [

//                 {

//                     title: 'Untitled',

//                     content: text,

//                     order: 1,

//                 },

//             ],

//         };

//     }

// }