// Import necessary modules and services
import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { ScrollerModule } from 'primeng/scroller';
import { CommonModule } from '@angular/common';
import { PendingOrderComponent } from '../pending-order/pending-order.component';
import { ActiveOrderComponentComponent } from "../active-order-component/active-order-component.component";
import { CompletedOrderComponent } from '../completed-order/completed-order.component';
import { TabViewModule } from 'primeng/tabview';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-admin',
    standalone: true,
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.scss'],
    imports: [
        ScrollerModule,
        CommonModule,
        PendingOrderComponent,
        ActiveOrderComponentComponent,
        CompletedOrderComponent,
        TabViewModule,
        FormsModule,
        InputTextModule,
        InputTextareaModule,
        ButtonModule

    ]
})
export class AdminComponent implements OnInit {
    pendingOrders = [];
    activeOrders = [];
    completedOrders = [];

    orderID: number = 0;
    itemReceived : string = '';
    trackingNumber: string = ''; 
    returned: boolean = false;
    challenge: boolean = false;

    constructor(private dataService: DataService) {}

    ngOnInit(): void {
        this.dataService.getPendingOrders().subscribe({
            next: (data) => {
                if (data.success) {
                    this.pendingOrders = data.orders;
                } else {
                    console.error('Failed to fetch pending orders');
                }
            },
            error: (error) => console.error('Error fetching pending orders:', error)
        });
    
        setTimeout(() => {
            this.dataService.getActiveOrders().subscribe({
                next: (data) => {
                    if (data.success) {
                        this.activeOrders = data.orders;
                    } else {
                        console.error('Failed to fetch active orders');
                    }
                },
                error: (error) => console.error('Error fetching active orders:', error)
            });
        }, 1500); // Delay of 1 second
    
        setTimeout(() => {
            this.dataService.getCompletedOrders().subscribe({
                next: (data) => {
                    if (data.success) {
                        this.completedOrders = data.orders;
                    } else {
                        console.error('Failed to fetch completed orders');
                    }
                },
                error: (error) => console.error('Error fetching completed orders:', error)
            });
        }, 2000); // Delay of 2 seconds



    }

    ownerConfirmAPIStatus : string = '';
    // ownerConfirmShipping() for Pawnshop
    ownerConfirmShipping() {
        if (this.itemReceived === 'yes') { // Use 'this.itemReceived' instead of 'value'
            this.dataService.ownerConfirmShipping(this.orderID).subscribe({ // Use 'this.orderID' instead of 'orderID'
                next: (data) => {
                    if (data) { // Use 'data' instead of 'd'
                        console.log('Owner confirmed shipping');
                        this.ownerConfirmAPIStatus = 'Owner confirmed shipping';

                    } else {
                        console.error('Failed to confirm shipping');
                        this.ownerConfirmAPIStatus = 'Failed to confirm shipping';
                    }
                },
                error: (error) => console.error('Error confirming shipping:', error)
            });
        } else {
            return; // Exit the function
            // this.callDifferentFunction();
        }
    }


    assignOwnerShippingHashAPIStatus : string = '';
    //assignOwnerShippingHash for Pawnshop
    assignOwnerShippingHash() {
        const trackingNumberInt = parseInt(this.trackingNumber);
        this.dataService.assignOwnerShippingHash(this.orderID,trackingNumberInt).subscribe({
            next: (data) => {
                if (data) {
                    console.log('Owner shipping hash assigned');
                    this.assignOwnerShippingHashAPIStatus = 'Owner shipping hash assigned';
                } else {
                    console.error('Failed to assign owner shipping hash');
                    this.assignOwnerShippingHashAPIStatus = 'Failed to assign owner shipping hash';
                }
            },
            error: (error) => console.error('Error assigning owner shipping hash:', error)
        });
    }

}
