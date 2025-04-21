import { CommonModule } from '@angular/common';
import { HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { map } from 'rxjs/operators';
import * as marked from 'marked'; // Import the marked library
import markedMoreLists from 'marked-more-lists';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

marked.use(markedMoreLists());

export interface Message {
  sender: 'user' | 'bot';
  text: SafeHtml | Promise<SafeHtml>
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    CommonModule,
  ],
  providers: [HttpClient],
})
export class ChatComponent implements OnInit, OnDestroy {
  message: string = '';
  responses: Message[] = [];
  apiUrl: string = 'http://localhost:8080/chat'; // Make sure the port matches your Spring Boot application

  constructor(
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {}

  sendMessage(): void {
    let html = marked.parse(this.message);
    this.responses.push({ sender: 'user', text: html });
    const botMessage : Message = {sender: 'bot', text : 'sending ...'};
    this.responses.push(botMessage);

    // const evsrc: EventSource = new EventSource(`${this.apiUrl}?message=${this.message}`);
    // evsrc.onmessage = (event) => {
    //   this.responses.push(event.data);
    // };


    this.http
      .get(`${this.apiUrl}?message=${this.message}`, {
        reportProgress: true,
        observe: 'events',
        responseType: 'text'
      })
      .pipe(
        map((response: any) => response) // Ensure the response is properly streamed
      )
      .subscribe({
        next: (event: HttpEvent<string>) => {
          if (event.type === HttpEventType.DownloadProgress) {
            // Sanitize the HTML to prevent XSS attacks
            html = marked.parse(
              ((event as HttpDownloadProgressEvent).partialText!).replaceAll(/(data:|\n)/g, '')
            );
            console.debug(botMessage);
            botMessage.text = html;
            // this.responses.push(message); // Add each response to the array
          }
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          this.responses.push({
            sender: 'bot',
            text: 'Error: ' + error.toString(),
          }); // Display the error in the stream
        },
      });
    this.message = ''; // Clear the message after sending
  }

  ngOnDestroy(): void {
    // if (this.evsrc) {
    //   this.evsrc.close();
    // }
  }
}
