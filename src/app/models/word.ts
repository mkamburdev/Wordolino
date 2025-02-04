export interface Word {
  word: string;
  phonetics: Array<{
    text?: string;
    audio?: string;
  }>;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      definition: string;
      example?: string;
    }>;
  }>;
  sourceUrls?: string[];
}

export interface WordWithTranslation {
  _id: string;
  word: string;
  translation?: string;
  phonetic?: string;
  audio?: string;
  definition?: string;
  example?: string;
}
