import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class AuthService { private http=inject(HttpClient); private readonly apiUrl='https://axwxlsai9xocqzi5jvnbebks.2.31.73.77.sslip.io/api'; login(email:string,password:string):Observable<{token:string}>{return this.http.post<{token:string}>(`${this.apiUrl}/auth/login`,{email,password}).pipe(tap(r=>localStorage.setItem('admin_token',r.token)));} logout(){const token=this.token();localStorage.removeItem('admin_token');if(token)this.http.post<void>(`${this.apiUrl}/auth/logout`,{},{headers:new HttpHeaders({Authorization:`Bearer ${token}`})}).subscribe({error:()=>{}});} isLoggedIn(){return !!localStorage.getItem('admin_token');} token(){return localStorage.getItem('admin_token');} }
