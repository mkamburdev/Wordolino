import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, from, map, mergeMap, of } from 'rxjs';
import { Word, WordWithTranslation } from '../../models/word';
import { HttpClient } from '@angular/common/http';
import { catchError, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WordService {
  private readonly apiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en';
  private wordsCache: string[] = [];
  private isLoading = false;
  private readonly currentScoreSubject = new BehaviorSubject<number>(0);
  readonly currentScore$ = this.currentScoreSubject.asObservable();

  constructor(private http: HttpClient) { }

  private getWord(word: string): Observable<WordWithTranslation | null> {
    return this.http.get<Word[]>(`${this.apiUrl}/${word}`).pipe(
      map(response => {
        const wordData = response[0];
        const firstMeaning = wordData.meanings[0];
        const firstDefinition = firstMeaning?.definitions[0];
        
        if (!firstDefinition?.definition) {
          return null;
        }

        const audio = wordData.phonetics.find(p => p.audio)?.audio;
        return {
          _id: word,
          word: wordData.word,
          phonetic: wordData.phonetics[0]?.text,
          audio: audio,
          definition: firstDefinition.definition,
          example: firstDefinition.example
        };
      }),
      catchError(() => of(null))
    );
  }

  private loadWords(): Observable<string[]> {
    if (this.wordsCache.length > 0) {
      return of(this.wordsCache);
    }
    return this.http.get('assets/english.txt', { responseType: 'text' }).pipe(
      map(text => {
        const words = text.split(/\r?\n/).map(w => w.trim()).filter(w => w !== '');
        this.wordsCache = words;
        return words;
      })
    );
  }

  getRandomWords(count: number = 4): Observable<WordWithTranslation[]> {
    return this.loadWords().pipe(
      mergeMap(words => {
        const shuffled = this.shuffleArray([...words]);
        const selectedWords = shuffled.slice(0, count);
        const wordObservables = selectedWords.map(word => this.getWord(word));
        return forkJoin(wordObservables).pipe(
          map(words => words.filter((word): word is WordWithTranslation => word !== null))
        );
      })
    );
  }

  getWordWithOptions(): Observable<{ word: WordWithTranslation, options: WordWithTranslation[] }> {
    if (this.isLoading) {
      return of();
    }
    this.isLoading = true;

    return this.loadWords().pipe(
      mergeMap(words => {
        const getValidWord = (): Observable<WordWithTranslation> => {
          const randomIndex = Math.floor(Math.random() * words.length);
          const selectedWord = words[randomIndex];
          
          return this.getWord(selectedWord).pipe(
            mergeMap(word => {
              if (!word) {
                return getValidWord();
              }
              return of(word);
            })
          );
        };

        return getValidWord().pipe(
          mergeMap(correctWord => {
            const otherWords = words.filter(w => w !== correctWord.word);
            const getValidOptions = (count: number): Observable<WordWithTranslation[]> => {
              if (count === 0) {
                return of([]);
              }

              const randomWord = this.shuffleArray(otherWords)[0];
              return this.getWord(randomWord).pipe(
                mergeMap(word => {
                  if (!word) {
                    return getValidOptions(count);
                  }
                  return getValidOptions(count - 1).pipe(
                    map(options => [word, ...options])
                  );
                })
              );
            };

            return getValidOptions(3).pipe(
              map(others => ({
                word: correctWord,
                options: this.shuffleArray([correctWord, ...others])
              }))
            );
          })
        );
      }),
      finalize(() => {
        this.isLoading = false;
      })
    );
  }

  private shuffleArray<T>(array: T[]): T[] {
    return [...array].sort(() => 0.5 - Math.random());
  }

  checkAnswer(correctWord: WordWithTranslation, selectedWord: WordWithTranslation): boolean {
    const isCorrect = correctWord._id === selectedWord._id;
    if (isCorrect) {
      this.incrementScore();
    }
    return isCorrect;
  }

  private incrementScore(): void {
    this.currentScoreSubject.next(this.currentScoreSubject.value + 1);
  }

  resetScore(): void {
    this.currentScoreSubject.next(0);
  }
}
