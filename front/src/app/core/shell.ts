import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TemaService } from './tema.service';

@Component({
  selector: 'app-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar class="barra">
      <button mat-icon-button type="button" aria-label="Alternar menu" (click)="menu.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="titulo">Mapa da Colaboração Científica · UNIFEI</span>
      <span class="espaco"></span>
      <button
        mat-icon-button
        type="button"
        [attr.aria-label]="tema.modo() === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'"
        (click)="tema.alternar()"
      >
        <mat-icon>{{ tema.modo() === 'escuro' ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>
    </mat-toolbar>
    <mat-sidenav-container class="container">
      <mat-sidenav #menu mode="side" opened class="menu">
        <mat-nav-list>
          <a
            mat-list-item
            routerLink="/visoes"
            routerLinkActive
            #rla="routerLinkActive"
            [activated]="rla.isActive"
          >
            <mat-icon matListItemIcon>dashboard_customize</mat-icon>
            <span matListItemTitle>Visões</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content class="conteudo">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      height: 100dvh;
    }
    .barra {
      flex: none;
      border-bottom: 1px solid var(--viz-grid);
      background: var(--viz-surface);
    }
    .titulo {
      margin-left: 8px;
      font-weight: 600;
    }
    .espaco {
      flex: 1;
    }
    .container {
      flex: 1;
      min-height: 0;
      background: var(--viz-page);
    }
    .menu {
      width: 220px;
      background: var(--viz-surface);
      border-right: 1px solid var(--viz-grid);
    }
    .conteudo {
      box-sizing: border-box;
      padding: 24px;
    }
  `,
})
export class Shell {
  protected readonly tema = inject(TemaService);
}
