import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class AuthService { private http=inject(HttpClient); private readonly apiUrl='https://elperuanojofemar.onrender.com/api'; login(email:string,password:string):Observable<{token:string}>{return this.http.post<{token:string}>(`${this.apiUrl}/auth/login`,{email,password}).pipe(tap(r=>localStorage.setItem('admin_token',r.token)));} logout(){localStorage.removeItem('admin_token');} isLoggedIn(){return !!localStorage.getItem('admin_token');} token(){return localStorage.getItem('admin_token');} }
