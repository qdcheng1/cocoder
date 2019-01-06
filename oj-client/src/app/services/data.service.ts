import { Injectable } from '@angular/core';
import { Problem } from '../models/problem.model';
import { Response, Http, Headers, RequestOptions } from '@angular/http';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class DataService {

  private problemsSource = new BehaviorSubject<Problem[]>([]);
  headers: any;

  constructor(private http: Http) { }

  getProblems(): Observable<Problem[]> {
    this.http.get("api/v1/problems")
      .toPromise()
      .then((res: Response) => {
        this.problemsSource.next(res.json());
      })
      .catch(this.handleError);

      return this.problemsSource.asObservable();
  }

  getProblem(id: number): Promise<Problem> {
    return this.http.get(`api/v1/problems/${id}`)
                    .toPromise()
                    .then((res: Response) => res.json())
                    .catch(this.handleError);
  }

  addProblem(problem: Problem): Promise<Problem> {
    this.headers = new Headers({'Content-Type':  'application/json',});
    let options: RequestOptions = new RequestOptions({ headers: this.headers });
    return this.http.post('api/v1/problems', problem, options)
      .toPromise()
      .then((res: Response) => {
        this.getProblems();
        return res.json();
      })
      .catch(this.handleError);
  }

  buildAndRun(data): Promise<any> {
    let headers = new Headers({'content-type' : 'application/json'});
    let options: RequestOptions = new RequestOptions({ headers: this.headers });
    return this.http.post('api/v1/build_and_run', data, options)
      .toPromise()
      .then((res: Response) => {
        console.log(res);
        return res.json();
      })
      .catch(this.handleError);

  }

  private handleError(error: any) : Promise<any> {
    console.error('An error occurred', error);
    return Promise.reject(error.boday || error);
  }
}
