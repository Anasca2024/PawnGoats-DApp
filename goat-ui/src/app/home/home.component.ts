import { Component } from '@angular/core';
import { TabViewModule } from 'primeng/tabview';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { RadioButtonModule } from 'primeng/radiobutton';
import { DataService } from '../data.service';
import { CommonModule } from '@angular/common';
import { stat } from 'node:fs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    TabViewModule,
    FormsModule,
    InputTextModule,
    InputTextareaModule,
    ButtonModule,
    RadioButtonModule,
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  // Using these
  price: number = 0;
  itemName: string = '';
  description: string = '';
  interestRate: string = '';
  maxFinalPayment: number = 0;
  
  // Not using these?
  trackingNumber: string = '';
  returned: boolean = false;
  challenge: boolean = false;


  // Using these
  orderStatus: string = '';
  orderID: number = 0;
  amountDue: string = '';
  subContractAddress: string = '';

  constructor(private dataService: DataService) {}

  // call createOrder in data.service.ts
  apiStatus: string = '';
  apiSuccess: boolean = false;

  createOrder(event: Event): void {
    event.preventDefault();
    console.log('Creating order...');
    this.dataService.createOrder(this.price, this.itemName, this.description, this.interestRate).subscribe({
      next: (response) => {
        if (response.success) {
          this.apiSuccess = true;
          this.orderID = response.orderNum;
          this.apiStatus = `Success! Your order ID is: ${this.orderID}. Take note of this, you will need it later.`;
        } else {
          this.apiSuccess = false;
          this.apiStatus = 'Request failed, please try again later.';
        }
      },
      error: (err) => {
        this.apiSuccess = false;
        this.apiStatus = 'Request failed, please try again later.';
      }
    });
  }

  calculateFinalPayment(): void {
    let interestRate = 0;
    let period = 1; // Default to 1 week if needed

    switch (this.interestRate) {
      case 'PLATINUM':
        interestRate = 35;
        period = 3; // 3 weeks
        break;
      case 'GOLD':
        interestRate = 25;
        period = 2; // 2 weeks
        break;
      case 'SILVER':
        interestRate = 15;
        period = 1; // 1 week
        break;
    }

    this.maxFinalPayment = this.price + (this.price * (interestRate / 100));
  }
  

  getOrderStatus(event: Event): void {
    event.preventDefault();
    console.log('Getting order status...');
  
    // Get the order status
    this.dataService.getOrder(this.orderID).subscribe(response => {
      const status1 = response.order.status;
  
      this.dataService.getSubContractAddress(this.orderID).subscribe(response => {
        let subContractAddressTemp = response.subContractAddress;
  
        if (subContractAddressTemp !== '0x0000000000000000000000000000000000000000') {
          this.subContractAddress = subContractAddressTemp;
  
          // Get the subcontract order status
          this.dataService.getSubContractOrder(this.orderID).subscribe(response => {
            const status2 = response.subContractOrder.status;
  
            if (status2 !== status1) {
              this.orderStatus = status2;
            } else {
              this.orderStatus = status1;
            }
  
            console.log('Order status:', this.orderStatus);
  
            // Check for the 'ACCEPTED' status after the status is set
            if (this.orderStatus === 'ACCEPTED') {
              this.dataService.getSubContractAddress(this.orderID).subscribe(response => {
                this.subContractAddress = response.subContractAddress;
                console.log(response);
                console.log('Subcontract address:', this.subContractAddress);
              });
            } else if (this.orderStatus === 'INPROGRESS') {
              this.dataService.getSubContractAddress(this.orderID).subscribe(response => {
                this.subContractAddress = response.subContractAddress;
                console.log(response);
                console.log('Subcontract address:', this.subContractAddress);
                console.log('Checking repay amount...');
                this.dataService.checkRepayAmount(this.orderID).subscribe(response => {
                  console.log(response);
                  console.log('Repay amount:', response.repayAmount);
                  this.amountDue = response.repayAmount;
                });
              });
            }
          });
        } else {
          this.subContractAddress = ''
          console.log("test2")
          this.orderStatus = status1;
          console.log('Order status:', this.orderStatus);
        }
      });
    });
  }

  pawnerConfirmShipping(event: Event): void {
    event.preventDefault();
    console.log('Pawner confirming shipping...');
    this.dataService.pawnerConfirmShipping(this.orderID).subscribe({
      next: (response) => {
        console.log(response);
        console.log('Pawner confirmed shipping.');
        this.confirmationFormStatusMessage = "Successfully confirmed shipping.";
      },
      error: (error) => {
        console.error('Error confirming shipping:', error);
        this.confirmationFormStatusMessage = "Failed to confirm shipping. Please try again.";
      }
    });
  }
  
  returnStatus = '';
  confirmationFormStatusMessage = '';

  onConfirmationFormSubmit(event: Event): void {
    event.preventDefault(); // Prevent the form from causing a page reload
  
    if (this.returnStatus === 'returned') {
      // If the item is returned, confirm shipping
      this.pawnerConfirmShipping(event);
    } else if (this.returnStatus === 'challenge') {
      // If a challenge is initiated, set the appropriate message
      this.confirmationFormStatusMessage = "Success! Challenge process initiated off chain";
      console.log(this.confirmationFormStatusMessage);
      // You may also want to handle additional logic here for the challenge process
    }
  }

  submitTrackingNumber(): void {
    console.log('Submitting tracking number...');
    this.dataService.assignPawnerShippingHash(this.orderID, parseInt(this.trackingNumber)).subscribe({
      next: (response) => {
        if (response.success) {
          this.apiStatus = 'Tracking number submitted successfully.';
        } else {
          this.apiStatus = 'Failed to submit tracking number. Please try again.';
        }
      },
      error: (err) => {
        console.error('Error submitting tracking number:', err);
        this.apiStatus = 'Error connecting to the service. Please check your network connection.';
      }
    });
  }

}
