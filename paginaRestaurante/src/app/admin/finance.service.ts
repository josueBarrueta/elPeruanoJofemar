import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
export interface InvoiceLine {description:string; quantity:number; unitPrice:number; taxRate:number;}
export interface Invoice { _id?:string; clientName:string; clientTaxId:string; clientAddress:string; date:string; lines:InvoiceLine[]; notes:string; subtotalCents?:number; taxCents?:number; totalCents?:number; archived?:boolean; }
export interface ExpenseRecord {_id?:string;supplier:string;description:string;category:string;date:string;totalCents:number;reference:string;paid:boolean;archived?:boolean;}
export interface BillingSettings {legalName:string;taxId:string;address:string;email:string;phone:string;invoiceSeries:string;currentBillingSystem:string;}
export const FINANCE_API_URL = new InjectionToken<string>('FINANCE_API_URL',{providedIn:'root',factory:()=> 'https://elperuanojofemar.onrender.com/api/admin/finance'});
@Injectable({providedIn:'root'})
export class FinanceService {
 private readonly http=inject(HttpClient);
 private readonly url=inject(FINANCE_API_URL);
 private options(){return {headers:new HttpHeaders({Authorization:`Bearer ${localStorage.getItem('admin_token') ?? ''}`})};}
 invoices(){return this.http.get<Invoice[]>(this.url+'/invoices',this.options());}
 expenses(){return this.http.get<ExpenseRecord[]>(this.url+'/expenses',this.options());}
 settings(){return this.http.get<Partial<BillingSettings>>(this.url+'/settings',this.options());}
 saveSettings(data:BillingSettings){return this.http.put<BillingSettings>(this.url+'/settings',data,this.options());}
 saveInvoice(data:Invoice){return data._id?this.http.put<Invoice>(this.url+'/invoices/'+data._id,data,this.options()):this.http.post<Invoice>(this.url+'/invoices',data,this.options());}
 saveExpense(data:ExpenseRecord){const body={...data,total:data.totalCents/100};return data._id?this.http.put<ExpenseRecord>(this.url+'/expenses/'+data._id,body,this.options()):this.http.post<ExpenseRecord>(this.url+'/expenses',body,this.options());}
 archive(kind:'invoices'|'expenses',id:string,archived:boolean){return this.http.patch(this.url+'/'+kind+'/'+id+'/archive',{archived},this.options());}
}
