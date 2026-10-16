import { CommonModule, registerLocaleData } from '@angular/common';
import { Component, Input, LOCALE_ID, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef, ElementRef, ViewChild, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize, of } from 'rxjs';
import localeEs from '@angular/common/locales/es';
import { MenuApiService, ApiMenuItem } from '../menu-api.service';
import { reportTotals, csvDocument, madridTimestamp } from './report-totals';
import { TableOrder } from './table-orders.service';
import { DocumentPreviewService, receiptReference } from './document-preview.service';
import { FinanceService, Invoice, ExpenseRecord, BillingSettings } from './finance.service';
registerLocaleData(localeEs);
@Component({selector:'app-finance',standalone:true,imports:[CommonModule,FormsModule],providers:[{provide:LOCALE_ID,useValue:'es-ES'}],templateUrl:'./finance.component.html',styleUrl:'./finance.component.scss'})
export class FinanceComponent implements OnInit, OnChanges {
 @Input() section:'invoices'|'expenses'|'reports'|'settings'='invoices';
 @ViewChild('issueDialog') issueDialog?:ElementRef<HTMLDialogElement>;
 issuingInvoice?:Invoice;
 private readonly api=inject(FinanceService);
 get issuerMissing(){return [['razón social',this.settings.legalName],['NIF',this.settings.taxId],['domicilio fiscal',this.settings.address],['serie',this.settings.invoiceSeries]].filter(([,value])=>!String(value||'').trim()).map(([name])=>name);}
 get issueReady(){return !this.issuerMissing.length;}
 get issuedInvoices(){return this.monthInvoices.filter(row=>row.status==='issued');}
 get draftInvoices(){return this.monthInvoices.filter(row=>row.status!=='issued');}
 get issuedTotal(){return this.issuedInvoices.reduce((sum,row)=>sum+(row.totalCents||0),0)/100;}
 requestIssue(row:Invoice){if(this.saving||row.status==='issued')return;if(!this.issueReady){this.error='Completa '+this.issuerMissing.join(', ')+' en Configuración.';return;}this.error='';this.issuingInvoice=row;this.issueDialog?.nativeElement.showModal();}
 cancelIssue(event?:Event){event?.preventDefault();if(!this.saving)this.issueDialog?.nativeElement.close();}
 confirmIssue(){const row=this.issuingInvoice;if(!row||this.saving)return;this.saving=true;this.error='';this.api.issueInvoice(row).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({next:invoice=>{this.invoices=[invoice,...this.invoices.filter(r=>r._id!==invoice._id)];this.issueDialog?.nativeElement.close();this.message='Factura '+invoice.invoiceNumber+' emitida. Puedes reimprimirla conservando su número.';this.printInvoice(invoice);},error:e=>{this.error=this.errorText(e);}});}

 private readonly cd=inject(ChangeDetectorRef);
 private readonly menuApi=inject(MenuApiService);
 menu:ApiMenuItem[]=[]; taxCategory=''; menuTaxRate:number|null=null;
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
 previousMonth(){const d=new Date(this.today()+'T12:00:00Z');d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()-1);this.month=d.toISOString().slice(0,7);this.periodType='month';this.configurePeriod();}
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
 get financialTotals(){return reportTotals(this.receipts,this.monthExpenses,this.invoices.filter(row=>!!row.sourceOrderId||this.inRange(row.date)));}
 get menuCategories(){return [...new Set(this.menu.map(item=>item.category))];}
 get missingProductTaxes(){return this.menu.filter(item=>item.taxRate==null).length;}
 configureMenuTax(){
  if(this.saving||this.menuTaxRate==null)return;this.saving=true;this.error='';
  this.api.configureMenuTax(this.taxCategory,this.menuTaxRate).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({next:result=>{this.menu=this.menu.map(item=>!this.taxCategory||item.category===this.taxCategory?{...item,taxRate:this.menuTaxRate}:item);this.message='IVA configurado para '+result.updated+' productos. Se aplicará a las nuevas comandas.';},error:e=>this.error=this.errorText(e)});
 }
 get savedClients(){const clients=new Map<string,Invoice>();for(const row of this.invoices){const key=row.clientTaxId?.replace(/\s/g,'').toUpperCase();if(key&&!clients.has(key))clients.set(key,row);}return [...clients.values()];}
 useSavedClient(taxId:string){const row=this.savedClients.find(row=>row.clientTaxId===taxId);if(row)this.receiptClient={...this.receiptClient,clientName:row.clientName,clientTaxId:row.clientTaxId,clientAddress:row.clientAddress};}
 get salesTotal(){return this.financialTotals.salesCents/100;}
 get filteredReceipts(){const q=this.search.toLocaleLowerCase();return this.receipts.filter(row=>(receiptReference(row)+' '+row.tableName).toLocaleLowerCase().includes(q));}
 printReceipt(row:TableOrder){this.documents.receipt(row,this.settings);}
 printInvoice(row:Invoice){this.documents.invoice(row,this.settings);}
 printReport(){this.documents.report(this.appliedFrom,this.appliedTo,this.receipts,this.monthExpenses,this.settings,this.invoices.filter(row=>!!row.sourceOrderId||this.inRange(row.date)));}
 prepareReceiptInvoice(row:TableOrder){
  const previous=this.invoices.find(invoice=>invoice.sourceOrderId===row._id);
  if(previous?.status==='issued'){this.printInvoice(previous);return;}
  this.receiptEditor=row;
  this.receiptClient={clientName:previous?.clientName||'',clientTaxId:previous?.clientTaxId||'',clientAddress:previous?.clientAddress||'',date:previous?.date||this.today(),notes:previous?.notes||''};
  this.receiptTaxRates=row.lines.map((_,i)=>previous?.lines[i]?.taxRate??row.lines[i].taxRate??this.menu.find(product=>product._id===row.lines[i].productId)?.taxRate??null);this.message='';this.error='';
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
 settings:BillingSettings={legalName:'',taxId:'',address:'',email:'',phone:'',invoiceSeries:'',invoiceStartingNumber:1,currentBillingSystem:''};
 loading=true; ready=false; saving=false; error=''; message=''; search=''; showArchived=false;
 month=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit'}).format(new Date());
 editor:'invoice'|'expense'|null=null;
 draft:Invoice=this.emptyInvoice(); expense:ExpenseRecord=this.emptyExpense();
 constructor(){effect(()=>{const row=this.documents.requestedInvoice();if(row&&this.ready)this.consumeInvoiceRequest();});}
 consumeInvoiceRequest(){const row=this.documents.requestedInvoice();if(row){this.documents.requestedInvoice.set(null);this.prepareReceiptInvoice(row);this.cd.markForCheck();}}
 ngOnInit(){this.load();}
 ngOnChanges(changes:SimpleChanges){if(changes['section']&&!changes['section'].firstChange){this.editor=null;this.receiptEditor=undefined;this.load();}}
 today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(new Date());}
 emptyInvoice():Invoice{return {clientName:'',clientTaxId:'',clientAddress:'',date:this.today(),lines:[{description:'',quantity:1,unitPrice:0,taxRate:0}],notes:''};}
 emptyExpense():ExpenseRecord{return {supplier:'',description:'',category:'Materia prima',date:this.today(),totalCents:0,reference:'',paid:false};}
 load(){if(!this.from||!this.to||this.from>this.to){this.error='Selecciona un periodo válido.';return;}const requestFrom=this.from,requestTo=this.to;this.loading=true;this.error='';forkJoin({receipts:this.section==='settings'?of([] as TableOrder[]):this.api.receipts(this.from,this.to),invoices:this.api.invoices(),expenses:this.api.expenses(),settings:this.api.settings(),menu:this.menuApi.getAdminMenu()}).pipe(finalize(()=>{this.loading=false;this.cd.markForCheck();})).subscribe({next:data=>{this.appliedFrom=requestFrom;this.appliedTo=requestTo;this.menu=data.menu;this.receipts=data.receipts;this.invoices=data.invoices;this.expenses=data.expenses;this.settings={...this.settings,...data.settings};this.ready=true;this.consumeInvoiceRequest();},error:e=>{this.ready=false;this.error=this.errorText(e);}});}
 errorText(e:any){return e.status===401?'Tu sesión ha caducado. Cierra sesión y vuelve a entrar.':e.error?.message || 'No se pudo conectar con la gestión. Comprueba que la API actualizada esté desplegada e inténtalo de nuevo.';}
 get monthInvoices(){return this.invoices.filter(row=>!row.archived&&this.inRange(row.date));}
 get monthExpenses(){return this.expenses.filter(row=>!row.archived&&this.inRange(row.date));}
 get draftTotal(){return this.draftInvoices.reduce((sum,row)=>sum+(row.totalCents??0),0)/100;}
 get expenseTotal(){return this.monthExpenses.reduce((sum,row)=>sum+row.totalCents,0)/100;}
 get paidExpenses(){return this.monthExpenses.filter(row=>row.paid).reduce((sum,row)=>sum+row.totalCents,0)/100;}
 get filteredInvoices(){return this.invoices.filter(row=>!!row.archived===this.showArchived&&this.inRange(row.date)&&(row.clientName+' '+row.clientTaxId).toLocaleLowerCase().includes(this.search.toLocaleLowerCase()));}
 get filteredExpenses(){return this.expenses.filter(row=>!!row.archived===this.showArchived&&this.inRange(row.date)&&(row.supplier+' '+row.description+' '+row.category).toLocaleLowerCase().includes(this.search.toLocaleLowerCase()));}
 get categories(){const totals=new Map<string,number>();for(const row of this.monthExpenses)totals.set(row.category,(totals.get(row.category)||0)+row.totalCents/100);return [...totals].map(([name,total])=>({name,total})).sort((a,b)=>b.total-a.total);}
 get weeks(){return [1,8,15,22,29].map(day=>({label:day+'–'+Math.min(day+6,new Date(Number(this.month.slice(0,4)),Number(this.month.slice(5,7)),0).getDate()),total:this.monthExpenses.filter(row=>{const d=Number(row.date.slice(8));return d>=day&&d<day+7;}).reduce((sum,row)=>sum+row.totalCents,0)/100})).filter(row=>Number(row.label.split('–')[0])<=new Date(Number(this.month.slice(0,4)),Number(this.month.slice(5,7)),0).getDate());}
 get maxWeek(){return Math.max(1,...this.weeks.map(row=>row.total));}
 get draftTotals(){let base=0,tax=0;for(const line of this.draft.lines){const cents=Math.round(line.quantity*line.unitPrice*100);base+=cents;tax+=Math.round(cents*line.taxRate/100);}return {base:base/100,tax:tax/100,total:(base+tax)/100};}
 newInvoice(){this.draft=this.emptyInvoice();this.editor='invoice';this.error='';this.message='';this.showEditor();}
 editInvoice(row:Invoice){if(row.status==='issued'){this.printInvoice(row);return;}if(row.sourceOrderId){this.message='Para modificar los datos de esta factura, abre su recibo de origen.';return;}this.draft={...row,lines:row.lines.map(line=>({...line}))};this.editor='invoice';this.error='';this.message='';this.showEditor();}
 newExpense(){this.expense=this.emptyExpense();this.editor='expense';this.error='';this.message='';this.showEditor();}
 editExpense(row:ExpenseRecord){this.expense={...row};this.editor='expense';this.error='';this.message='';this.showEditor();}
 showEditor(){requestAnimationFrame(()=>document.querySelector('.record-editor')?.scrollIntoView({block:'start',behavior:'smooth'}));}
 attachmentLoading=false;
 async selectAttachment(event:Event){
  const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file)return;
  if(!['application/pdf','image/png','image/jpeg'].includes(file.type)||file.size>2*1024*1024){this.error='Adjunta un PDF, JPG o PNG de hasta 2 MB.';input.value='';return;}
  this.attachmentLoading=true;this.error='';
  const draft=this.expense;
  try{const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});if(this.expense===draft){draft.attachment={name:file.name,mimeType:file.type,data};draft.attachmentName=file.name;}}
  catch{this.error='No se pudo leer el justificante.';}
  finally{this.attachmentLoading=false;this.cd.markForCheck();}
 }
 downloadAttachment(row:ExpenseRecord){if(!row._id)return;this.api.attachment(row._id).subscribe({next:blob=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=row.attachmentName||'justificante';a.click();URL.revokeObjectURL(url);},error:e=>{this.error=this.errorText(e);this.cd.markForCheck();}});}
 setExpenseTax(value:number|null){this.expense.taxCents=value==null?null:Math.round(value*100);}
 setExpenseAmount(value:number){this.expense.totalCents=Math.round(value*100);}
 saveInvoice(){if(this.saving)return;this.saving=true;this.error='';this.api.saveInvoice(this.draft).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({next:row=>{this.invoices=[row,...this.invoices.filter(item=>item._id!==row._id)];this.editor=null;this.message='Borrador guardado en la base de datos.';},error:e=>this.error=this.errorText(e)});}
 saveExpense(){if(this.saving||this.attachmentLoading)return;this.saving=true;this.error='';this.api.saveExpense(this.expense).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({next:row=>{this.expenses=[row,...this.expenses.filter(item=>item._id!==row._id)];this.editor=null;this.message='Gasto guardado. Los informes se han actualizado.';},error:e=>this.error=this.errorText(e)});}
 saveSettings(){if(this.saving)return;this.saving=true;this.error='';this.api.saveSettings(this.settings).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({next:row=>{this.settings=row;this.message='Configuración guardada.';},error:e=>this.error=this.errorText(e)});}
 archive(kind:'invoices'|'expenses',row:Invoice|ExpenseRecord){if(!row._id||this.saving)return;this.saving=true;this.error='';this.api.archive(kind,row._id,!row.archived).pipe(finalize(()=>{this.saving=false;this.cd.markForCheck();})).subscribe({next:()=>{row.archived=!row.archived;this.message=row.archived?'Registro archivado. Puedes recuperarlo desde Archivados.':'Registro restaurado.';},error:e=>this.error=this.errorText(e)});}
 exportMonthly(){
  const t=this.financialTotals;
  const rows:unknown[][]=[['RESUMEN PARA GESTORÍA',this.appliedFrom,this.appliedTo],['Ventas EUR',t.salesCents/100],['Cobros registrados EUR',t.paidCents/100],['Efectivo EUR',t.cashCents/100],['Tarjeta EUR',t.cardCents/100],['Sin cobro registrado EUR',t.unrecordedPaymentCents/100],['Ventas pendientes de IVA EUR',t.unknownTaxCents/100],['Gastos EUR',t.expenseCents/100],['IVA de gastos registrado EUR',t.expenseTaxCents/100],['Gastos con IVA pendiente EUR',t.unknownExpenseTaxCents/100],[],['DESGLOSE IVA VENTAS'],['Tipo %','Base EUR','IVA EUR','Total EUR'],...t.groups.map(g=>[g.rate,g.baseCents/100,g.taxCents/100,g.grossCents/100]),[],['VENTAS / COBROS'],['Recibo','Mesa','Fecha cierre','Total EUR','Forma pago','Efectivo EUR','Tarjeta EUR','Factura vinculada / Estado'],...this.receipts.map(r=>[receiptReference(r),r.tableName,madridTimestamp(r.closedAt),r.totalCents/100,r.payment?.method||'Sin registrar',r.payment?.cashCents!=null?r.payment.cashCents/100:'',r.payment?.cardCents!=null?r.payment.cardCents/100:'',this.invoices.find(i=>i.sourceOrderId===r._id)?.invoiceNumber||(this.invoices.some(i=>i.sourceOrderId===r._id)?'Borrador':'No')]),[],['FACTURAS EMITIDAS DEL PERIODO'],['Número','Fecha emisión','Cliente','NIF cliente','Recibo origen','Base EUR','IVA EUR','Total EUR'],...this.issuedInvoices.map(i=>[i.invoiceNumber,i.date,i.clientName,i.clientTaxId,i.sourceOrderId||'Venta sin recibo',(i.subtotalCents||0)/100,(i.taxCents||0)/100,(i.totalCents||0)/100]),[],['GASTOS'],['Fecha','Proveedor','Concepto','Categoría','Referencia justificante','Total EUR','IVA EUR','Pagado'],...this.monthExpenses.map(e=>[e.date,e.supplier,e.description,e.category,e.reference,e.totalCents/100,e.taxCents==null?'Pendiente':e.taxCents/100,e.paid?'Sí':'No'])];
  this.downloadCsv(rows,'gestoria');
 }
 downloadCsv(rows:unknown[][],prefix:string){const url=URL.createObjectURL(new Blob([csvDocument(rows)],{type:'text/csv;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download=prefix+'-'+this.appliedFrom+'-'+this.appliedTo+'.csv';link.click();URL.revokeObjectURL(url);}
 exportExpenses(){this.downloadCsv([['Fecha','Proveedor','Concepto','Categoría','Referencia','Importe EUR','IVA EUR','Pagado','Justificante'],...this.monthExpenses.map(row=>[row.date,row.supplier,row.description,row.category,row.reference,row.totalCents/100,row.taxCents==null?'Pendiente':row.taxCents/100,row.paid?'Sí':'No',row.attachmentName||''])],'gastos');}
}
