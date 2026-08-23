import { ParsedDocument } from '../../interfaces/document.interface';

export interface ContentParser {

    parse(
        file: string,
    ): Promise<ParsedDocument>;

}