import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-completed-order',
  standalone: true,
  imports: [],
  templateUrl: './completed-order.component.html',
  styleUrl: './completed-order.component.scss'
})
export class CompletedOrderComponent {
  @Input() order: any;
}
