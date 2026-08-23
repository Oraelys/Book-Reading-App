export const CHAPTER_PATTERNS: RegExp[] = [

    /^chapter\s+\d+/i,

    /^chapter\s+[ivxlcdm]+/i,

    /^chapter\s+[a-z]+/i,

    /^\d+\.$/,

    /^part\s+\d+/i,

    /^book\s+\d+/i,

    /^prologue$/i,

    /^epilogue$/i,

    /^interlude$/i,

    /^appendix$/i,

    /^afterword$/i,

    /^bonus chapter$/i,

];