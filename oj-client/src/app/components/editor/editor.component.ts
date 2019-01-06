import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DataService } from './../../services/data.service';

declare var ace: any;
@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit {
  editor:any;
  languages: string[] = ["Java", "Python"];
  language: string = 'Java';
  output: string = '';
  sessionId: string;

  // TODO: if more languages are added, need a map for language and mode
  defaultContent = {
'Java': `public class Example {

    public static void main(String[] args) {
      // Type your code here

    }
}`,
'Python': `class Solution:
  def example:
    print('Hello Python')`
  };

  constructor(@Inject('collaboration') private collaboration,
              private dataService: DataService,
              private route: ActivatedRoute) { }

  ngOnInit() {
    this.route.params
      .subscribe( params => {
        this.sessionId = params['id'];
        this.initEditor();
      });
  }

  initEditor() {
    this.editor = ace.edit('editor');
    this.editor.setTheme('ace/theme/eclipse');
    this.resetEditor();
    document.getElementsByTagName('textarea')[0].focus();

    this.collaboration.init(this.editor, this.sessionId);
    this.editor.lastAppliedChange = null;

    this.editor.on('change', (e) => {
      //console.log('editor changes: ' + JSON.stringify(e));
      if (this.editor.lastAppliedChange != e) {
        this.collaboration.change(JSON.stringify(e));
      }
    });


    this.editor.getSession().getSelection().on("changeCursor", () => {
      let cursor = this.editor.getSession().getSelection().getCursor();
      this.collaboration.cursorMove(JSON.stringify(cursor));
    });

    this.collaboration.restoreBuffer();

  }

  setLanguage(language: string): void {
    this.language = language;
    this.resetEditor();
  }

  resetEditor(): void {
    //console.log("Reseting editor.");
    this.editor.session.setMode(`ace/mode/${this.language.toLowerCase()}`);
    this.editor.setValue(this.defaultContent[this.language]);
    this.output = 'abc';
  }

  submit(): void {
    let userCode = this.editor.getValue();
    let data = {
      user_code: userCode,
      lang: this.language.toLowerCase()
    };
    this.dataService.buildAndRun(data)
          .then(res => this.output = res.text);
  }

}
