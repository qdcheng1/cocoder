import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  title = "CoCoder";
  userName = "Admin";
  profile: any;
  subscription: Subscription;
  searchBox : FormControl = new FormControl();

  constructor(@Inject('auth') private auth,
              @Inject('input') private input,
              private router: Router) {
    this.auth.userProfile.subscribe(
      profile => this.profile = profile
    );

  }

  ngOnInit() {
    this.subscription = this.searchBox
                                      .valueChanges
                                      .pipe(debounceTime(200))
                                      .subscribe(
                                        term => {
                                          this.input.changeInput(term);
                                        }
                                      )
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  searchProblem(): void {
    this.router.navigate(['/problems']);
  }

  login(): void {
    this.auth.login();
  }

  logout(): void {
    this.auth.logout();
  }

}
