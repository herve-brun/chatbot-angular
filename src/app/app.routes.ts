import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';

export const routes: Routes = [
  { path: 'chat', component: ChatComponent },
  { path: '', pathMatch: 'full', redirectTo: 'chat' }, // Redirect the root to chat
];
