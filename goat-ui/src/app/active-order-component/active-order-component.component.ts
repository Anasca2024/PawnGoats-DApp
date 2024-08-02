import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-active-order-component',
  standalone: true,
  imports: [],
  templateUrl: './active-order-component.component.html',
  styleUrl: './active-order-component.component.scss'
})
export class ActiveOrderComponentComponent {
  @Input() order: any;

  convertEpochToDate(epoch: number): string {
    return new Date(epoch * 1000).toLocaleDateString("en-US");  // Converts to local date string
  }
  
}
