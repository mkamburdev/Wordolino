import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { WordWithTranslation } from '../../models/word';
import { WordService } from '../../core/services/word.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule
  ],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  currentWord: WordWithTranslation | null = null;
  options: WordWithTranslation[] = [];
  showNextButton = false;
  selectedWordId: string | null = null;
  lastAnswerCorrect: boolean | null = null;

  constructor(
    private wordService: WordService,
    private router: Router // Inject Router
  ) {}

  score$!: Observable<number>;

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private setCookie(name: string, value: string, days = 7): void {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
  }

  ngOnInit(): void {
    const savedScore = this.getCookie('wordolino_score');
    if (savedScore !== null) {
      (this.wordService as any).currentScoreSubject.next(+savedScore);
    } else {
      this.wordService.resetScore();
    }
    this.score$ = this.wordService.currentScore$.pipe(
      takeUntil(this.destroy$)
    );

    this.score$.pipe(takeUntil(this.destroy$)).subscribe(score => {
      this.setCookie('wordolino_score', score.toString());
    });

    this.startGame();
  }

  startGame(): void {
    if (this.getCookie('wordolino_score') === null) {
      this.wordService.resetScore();
    }
    this.loadNextWord();
  }

  loadNextWord(): void {
    this.wordService.getWordWithOptions().pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.currentWord = result.word;
      this.options = result.options;
      this.showNextButton = false;
      this.selectedWordId = null;
      this.lastAnswerCorrect = null;
    });
  }

  checkAnswer(selectedWord: WordWithTranslation): void {
    if (this.showNextButton || !this.currentWord || !selectedWord._id) return;

    this.selectedWordId = selectedWord._id;
    const isCorrect = this.wordService.checkAnswer(this.currentWord, selectedWord);
    this.lastAnswerCorrect = isCorrect;
    this.showNextButton = true;

    if (this.currentWord?.audio) {
      this.playAudio(this.currentWord.audio);
    }

    setTimeout(() => {
      this.loadNextWord();
    }, 2000);
  }

  playAudio(audioUrl: string): void {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.play();
  }

  isCorrectAnswer(wordId: string): boolean | null {
    if (!this.showNextButton || !this.currentWord || !this.currentWord._id || !wordId) return null;
    return this.currentWord._id === wordId;
  }

  isWrongAnswer(wordId: string): boolean | null {
    if (!this.showNextButton || !this.currentWord || !this.currentWord._id || !wordId) return null;
    return this.selectedWordId === wordId && this.currentWord._id !== wordId;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  navigateToHome(): void {
    this.router.navigate(['/']); // Navigate to the start page
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
