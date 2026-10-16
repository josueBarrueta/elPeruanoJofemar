import { CommonModule, registerLocaleData } from '@angular/common';
import { Component, Input, LOCALE_ID, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize, of } from 'rxjs';
import localeEs from '@angular/common/locales/es';
import { TableOrder } from './table-orders.service';
import { DocumentPreviewService, receiptReference } from './document-preview.service';
import { FinanceService, Invoice, ExpenseRecord, BillingSettings } from './finance.service';
registerLocaleData(localeEs);
@Component({selector:'app-finance',standalone:true,imports:[CommonModule,FormsModule],providers:[{provide:LOCALE_ID,useValue:'es-ES'}],templateUrl:'./finance.component.html',styleUrl:'./finance.component.scss'})
export class FinanceComponent implements OnInit, OnChanges {
 @Input() section:'invoices'|'expenses'|'reports'|'settings'='invoices';
 private readonly api=inject(FinanceService);
 private readonly cd=inject(ChangeDetectorRef);
 private readonly documents=inject(DocumentPreviewService);
 receipts:TableOrder[]=[];
 receiptEditor?:TableOrder;
 receiptClient={clientName:'',clientTaxId:'',clientAddress:'',date:'',notes:''};
 receiptTaxRates:(number|null)[]=[];
 periodType:'day'|'week'|'month'|'year'|'custom'='month';
 periodDay=this.today();
 periodYear=Number(this.today().slice(0,4));
 from=this.today().slice(0,7)+'-01';
 to=this.monthEnd(this.today().slice(0,7));
 appliedFrom=this.from;
 appliedTo=this.to;
 receiptReference=receiptReference;
 monthEnd(month:string){const [year,m]=month.split('-').map(Number);return new Date(Date.UTC(year,m,0)).toISOString().slice(0,10);}
 configurePeriod(){
  if(this.periodType==='day')this.from=this.to=this.periodDay;
  if(this.periodType==='week'){
   const d=new Date(this.periodDay+'T12:00:00Z');if(!Number.isFinite(d.getTime()))return;
   d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));this.from=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+6);this.to=d.toISOString().slice(0,10);
  }
  if(this.periodType==='month'&&/^\d{4}-\d{2}$/.test(this.month)){this.from=this.month+'-01';this.to=this.monthEnd(this.month);}
  if(this.periodType==='year'&&Number.isInteger(this.periodYear)&&this.periodYear>=1900&&this.periodYear<=9999){this.from=this.periodYear+'-01-01';this.to=this.periodYear+'-12-31';}
  this.load();
 }
 inRange(day:string){return day>=this.appliedFrom&&day<=this.appliedTo;}
 get salesTotal(){return this.receipts.reduce((sum,row)=>sum+row.totalCents,0)/100;}
 get filteredReceipts(){const q=this.search.toLocaleLowerCase();return this.receipts.filter(row=>(receiptReference(row)+' '+row.tableName).toLocaleLowerCase().includes(q));}
 printReceipt(row:TableOrder){this.documents.receipt(row,this.settings);}
 printInvoice(row:Invoice){this.documents.invoice(row,this.settings);}
 printReport(){this.documents.report(this.appliedFrom,this.appliedTo,this.receipts,this.monthExpenses,this.settings);}
 prepareReceiptInvoice(row:TableOrder){
  const previous=this.invoices.find(invoice=>invoice.sourceOrderId===row._id);
  this.receiptEditor=row;
  this.receiptClient={clientName:previous?.clientName||'',clientTaxId:previous?.clientTaxId||'',clientAddress:previous?.clientAddress||'',date:previous?.date||this.today(),notes:previous?.notes||''};
  this.receiptTaxRates=row.lines.map((_,i)=>previous?.lines[i]?.taxRate??null);this.message='';this.error='';
  requestAnimationFrame(()=>document.querySelector('.receipt-invoice-editor')?.scrollIntoView({block:'start',behavior:'smooth'}));
 }
 saveReceiptInvoice(){
  if(this.saving||!this.receiptEditor||this.receiptTaxRates.some(rate=>rate===null))return;
  this.saving=true;this.error='';
  this.api.receiptInvoice(this.receiptEditor._id,{...this.receiptClient,taxRates:this.receiptTaxRates}).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({
   next:row=>{this.invoices=[row,...this.invoices.filter(item=>item._id!==row._id)];this.receiptEditor=undefined;this.message='Borrador de factura guardado y vinculado al recibo.';this.printInvoice(row);},error:e=>this.error=this.errorText(e)
  });
 }

 invoices:Invoice[]=[]; expenses:ExpenseRecord[]=[];
 settings:BillingSettings={legalName:'',taxId:'',address:'',email:'',phone:'',invoiceSeries:'',currentBillingSystem:''};
 loading=true; ready=false; saving=false; error=''; message=''; search=''; showArchived=false;
 month=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit'}).format(new Date());
 editor:'invoice'|'expense'|null=null;
 draft:Invoice=this.emptyInvoice(); expense:ExpenseRecord=this.emptyExpense();
 ngOnInit(){this.load();}
 ngOnChanges(changes:SimpleChanges){if(changes['section']&&!changes['section'].firstChange){this.editor=null;this.receiptEditor=undefined;this.load();}}
 today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(new Date());}
 emptyInvoice():Invoice{return {clientName:'',clientTaxId:'',clientAddress:'',date:this.today(),lines:[{description:'',quantity:1,unitPrice:0,taxRate:0}],notes:''};}
 emptyExpense():ExpenseRecord{return {supplier:'',description:'',category:'Materia prima',date:this.today(),totalCents:0,reference:'',paid:false};}
 load(){if(!this.from||!this.to||this.from>this.to){this.error='Selecciona un periodo válido.';return;}const requestFrom=this.from,requestTo=this.to;this.loading=true;this.error='';forkJoin({receipts:this.section==='settings'?of([] as TableOrder[]):this.api.receipts(this.from,this.to),invoices:this.api.invoices(),expenses:this.api.expenses(),settings:this.api.settings()}).pipe(finalize(()=>{this.loading=false;this.cd.markForCheck();})).subscribe({next:data=>{this.appliedFrom=requestFrom;this.appliedTo=requestTo;this.receipts=data.receipts;this.invoices=data.invoices;this.expenses=data.expenses;this.settings={...this.settings,...data.settings};this.ready=true;},error:e=>{this.ready=false;this.error=this.errorText(e);}});}
 errorText(e:any){return e.status===401?'Tu sesión ha caducado. Cierra sesión y vuelve a entrar.':e.error?.message || 'No se pudo conectar con la gestión. Comprueba que la API actualizada esté desplegada e inténtalo de nuevo.';}
 get monthInvoices(){return this.invoices.filter(row=>!row.archived&&this.inRange(row.date));}
 get monthExpenses(){return this.expenses.filter(row=>!row.archived&&this.inRange(row.date));}
 get draftTotal(){return this.monthInvoices.reduce((sum,row)=>sum+(row.totalCents??0),0)/100;}
 get expenseTotal(){return this.monthExpenses.reduce((sum,row)=>sum+row.totalCents,0)/100;}
 get paidExpenses(){return this.monthExpenses.filter(row=>row.paid).reduce((sum,row)=>sum+row.totalCents,0)/100;}
 get filteredInvoices(){return this.invoices.filter(row=>!!row.archived===this.showArchived&&this.inRange(row.date)&&(row.clientName+' '+row.clientTaxId).toLocaleLowerCase().includes(this.search.toLocaleLowerCase()));}
 get filteredExpenses(){return this.expenses.filter(row=>!!row.archived===this.showArchived&&this.inRange(row.date)&&(row.supplier+' '+row.description+' '+row.category).toLocaleLowerCase().includes(this.search.toLocaleLowerCase()));}
 get categories(){const totals=new Map<string,number>();for(const row of this.monthExpenses)totals.set(row.category,(totals.get(row.category)||0)+row.totalCents/100);return [...totals].map(([name,total])=>({name,total})).sort((a,b)=>b.total-a.total);}
 get weeks(){return [1,8,15,22,29].map(day=>({label:day+'–'+Math.min(day+6,new Date(Number(this.month.slice(0,4)),Number(this.month.slice(5,7)),0).getDate()),total:this.monthExpenses.filter(row=>{const d=Number(row.date.slice(8));return d>=day&&d<day+7;}).reduce((sum,row)=>sum+row.totalCents,0)/100})).filter(row=>Number(row.label.split('–')[0])<=new Date(Number(this.month.slice(0,4)),Number(this.month.slice(5,7)),0).getDate());}
 get maxWeek(){return Math.max(1,...this.weeks.map(row=>row.total));}
 get draftTotals(){let base=0,tax=0;for(const line of this.draft.lines){const cents=Math.round(line.quantity*line.unitPrice*100);base+=cents;tax+=Math.round(cents*line.taxRate/100);}return {base:base/100,tax:tax/100,total:(base+tax)/100};}
 newInvoice(){this.draft=this.emptyInvoice();this.editor='invoice';this.error='';this.message='';this.showEditor();}
 editInvoice(row:Invoice){if(row.sourceOrderId){this.message='Para modificar los datos de esta factura, abre su recibo de origen.';return;}this.draft={...row,lines:row.lines.map(line=>({...line}))};this.editor='invoice';this.error='';this.message='';this.showEditor();}
 newExpense(){this.expense=this.emptyExpense();this.editor='expense';this.error='';this.message='';this.showEditor();}
 editExpense(row:ExpenseRecord){this.expense={...row};this.editor='expense';this.error='';this.message='';this.showEditor();}
 showEditor(){requestAnimationFrame(()=>document.querySelector('.record-editor')?.scrollIntoView({block:'start',behavior:'smooth'}));}
 setExpenseAmount(value:number){this.expense.totalCents=Math.round(value*100);}
 saveInvoice(){if(this.saving)return;this.saving=true;this.error='';this.api.saveInvoice(this.draft).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({next:row=>{this.invoices=[row,...this.invoices.filter(item=>item._id!==row._id)];this.editor=null;this.message='Borrador guardado en la base de datos.';},error:e=>this.error=this.errorText(e)});}
 saveExpense(){if(this.saving)return;this.saving=true;this.error='';this.api.saveExpense(this.expense).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({next:row=>{this.expenses=[row,...this.expenses.filter(item=>item._id!==row._id)];this.editor=null;this.message='Gasto guardado. Los informes se han actualizado.';},error:e=>this.error=this.errorText(e)});}
 saveSettings(){if(this.saving)return;this.saving=true;this.error='';this.api.saveSettings(this.settings).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({next:row=>{this.settings=row;this.message='Configuración guardada.';},error:e=>this.error=this.errorText(e)});}
 archive(kind:'invoices'|'expenses',row:Invoice|ExpenseRecord){if(!row._id||this.saving)return;this.saving=true;this.error='';this.api.archive(kind,row._id,!row.archived).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({next:()=>{row.archived=!row.archived;this.message=row.archived?'Registro archivado. Puedes recuperarlo desde Archivados.':'Registro restaurado.';},error:e=>this.error=this.errorText(e)});}
 exportExpenses(){const rows=[['Fecha','Proveedor','Concepto','Categoría','Importe EUR','Pagado'],...this.monthExpenses.map(row=>[row.date,row.supplier,row.description,row.category,(row.totalCents/100).toFixed(2),row.paid?'Sí':'No'])];const csv='\uFEFF'+rows.map(row=>row.map(cell=>'"'+String(cell).replace(/^[\s]*[=+@\-]/,"'$&").replace(/"/g,'""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='gastos-'+this.appliedFrom+'-'+this.appliedTo+'.csv';link.click();URL.revokeObjectURL(url);}
}
