import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { TabViewModule } from 'primeng/tabview';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { appRoutes } from './app.routes';

@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(appRoutes), // Use your routes here
    TabViewModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [],
  // If AppComponent is standalone, it should not be bootstrapped here
  bootstrap: []
})
export class AppModule { }
