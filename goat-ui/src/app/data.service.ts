import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private baseUrl = 'http://localhost:5000';

  constructor(private http: HttpClient) { }

  // POST: Create Order
  createOrder(price: number, itemName: string, description: string, interestRate: string): Observable<any> {
    const body = { price, itemName, description, interestRate };
    return this.http.post(`${this.baseUrl}/createOrder`, body);
  }

  // POST: Accept Order
  acceptOrder(orderID: number): Observable<any> {
    const body = { orderID };
    return this.http.post(`${this.baseUrl}/acceptOrder`, body);
  }

  // POST: Assign Pawner Shipping Hash
  assignPawnerShippingHash(orderID: number, shippingNumber: number): Observable<any> {
    const body = { orderID, shippingNumber };
    return this.http.post(`${this.baseUrl}/assignPawnerShippingHash`, body);
  }

  // POST: Owner Confirm Package Received
  ownerConfirmShipping(orderID: number): Observable<any> {
    const body = { orderID };
    return this.http.post(`${this.baseUrl}/ownerConfirmShipping`, body);
  }

  // POST: Assign Owner Shipping Hash
  assignOwnerShippingHash(orderID: number, shippingNumber: number): Observable<any> {
    const body = { orderID, shippingNumber };
    return this.http.post(`${this.baseUrl}/assignOwnerShippingHash`, body);
  }

  // POST: User Confirms Package Received
  pawnerConfirmShipping(orderID: number): Observable<any> {
    const body = { orderID };
    return this.http.post(`${this.baseUrl}/pawnerConfirmShipping`, body);
  }

  // GET: Fetch Order Details
  getOrder(orderID: number): Observable<any> {
    const params = new HttpParams().set('orderID', orderID.toString());
    return this.http.get(`${this.baseUrl}/getOrder`, { params });
  }

  // GET: Get Subcontract Address
  getSubContractAddress(orderID: number): Observable<any> {
    const params = new HttpParams().set('orderID', orderID.toString());
    return this.http.get(`${this.baseUrl}/getSubContractAddress`, { params });
  }

  // GET: Get SubContractVars
  getSubContractVars(orderID: number): Observable<any> {
    const params = new HttpParams().set('orderID', orderID.toString());
    return this.http.get(`${this.baseUrl}/getSubContractVars`, { params });
  }

  // GET: Get Subcontract Order
  getSubContractOrder(orderID: number): Observable<any> {
    const params = new HttpParams().set('orderID', orderID.toString());
    return this.http.get(`${this.baseUrl}/getSubContractOrder`, { params });
  }

  // GET: Get Business Contract Balance
  getBusinessContractBalance(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getBusinessContractBalance`);
  }

  // GET: Get Subcontract Balance
  getSubContractBalance(orderID: number): Observable<any> {
    const params = new HttpParams().set('orderID', orderID.toString());
    return this.http.get(`${this.baseUrl}/getSubContractBalance`, { params });
  }

  // POST: Get Pending Orders
  getPendingOrders(): Observable<any> {
    return this.http.post(`${this.baseUrl}/getPendingOrders`, {});
  }

  // POST: Get Active Orders
  getActiveOrders(): Observable<any> {
    return this.http.post(`${this.baseUrl}/getActiveOrders`, {});
  }

  // POST: Get Completed Orders
  getCompletedOrders(): Observable<any> {
    return this.http.post(`${this.baseUrl}/getCompletedOrders`, {});
  }

  // POST: Check Repay Amount
  checkRepayAmount(orderID: number): Observable<any> {
    const params = new HttpParams().set('orderID', orderID.toString());
    return this.http.post(`${this.baseUrl}/checkRepayAmount?orderID=${orderID}`, { });
  }

  // 
}
