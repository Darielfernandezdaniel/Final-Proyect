import { Injectable } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { DalleImageResponse } from '../Interfaces/Interfaces';

@Injectable({
  providedIn: 'root',
})
export class DalleService {
  private cloudFunctionUrl = 'TU_URL_DE_GOOGLE_CLOUD_FUNCTION';

  constructor(private functions: Functions) {}

  generateImage(prompt: string): Observable<DalleImageResponse> {
    const generateDalleImageCallable = httpsCallable<{ prompt: string }, DalleImageResponse>(this.functions, 'generateDalleImage');

    return from(generateDalleImageCallable({ prompt: prompt })).pipe(map((response) => response.data));
  }
}
