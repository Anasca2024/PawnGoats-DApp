import { Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { DataService } from '../data.service';

@Component({
    selector: 'app-pending-order',
    standalone: true,
    imports: [ButtonModule],
    templateUrl: './pending-order.component.html',
    styleUrls: ['./pending-order.component.scss']
})
export class PendingOrderComponent {
    @Input() order: any;
    constructor(private dataService: DataService) {}

    acceptOrder() {
        this.dataService.acceptOrder(this.order.contractID).subscribe(response => {
            console.log(response);
            window.location.reload(); // this is messy but it works
        }, error => {
            console.error('Error accepting order:', error);
        });
    }
}
