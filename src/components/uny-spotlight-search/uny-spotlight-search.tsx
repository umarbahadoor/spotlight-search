import {Listen, Component, Element, State, Prop, h, Event, EventEmitter} from '@stencil/core';
import {HTMLStencilElement} from "@stencil/core/internal";
import {search} from "ss-search";

class UnySpotLightSearchResultItem {

  image: string;

  title: string;

  description: string;

  action: any;

  isActive: boolean = false;

  constructor(title: string, description: string, image: string, action: any) {
    this.title = title;
    this.description = description;
    this.image = image;
    this.action = action;
    this.isActive = false;
  }

  getCssClasses(): string {
    const classes = ['spotlight-search__item'];

    if (this.isActive) {
      classes.push('spotlight-search__item--active');
    }

    return classes.join(' ');
  }
}

class PromiseAbortSignal {
  private _isPending: boolean = false;

  reject: (reason: any) => void ;

  constructor() {
    this.reject = () => {};
  }

  setup(reject: (reason: any) => void) {
    this.reject = reject;
    this._isPending = true;
  }

  complete() {
    this._isPending = false;
  }

  isPending(): boolean {
    return this._isPending;
  }
}

@Component({
  tag: 'uny-spotlight-search',
  styleUrl: 'uny-spotlight-search.css',
  shadow: true,
})
export class UnySpotlightSearch {

  @Element() private el: HTMLStencilElement;

  @State() tick: number = 0;

  @State() currentActiveItemIndex: number = -1;

  @State() dblCtrlKey: number = 0;

  @State() isOpen: boolean = false;

  @State() typedText: string = '';

  private defaultHelpText: string = 'What are you looking for?';

  private currentStepHelpText: string = '';

  @State() helpText: string = '';

  @State() results: UnySpotLightSearchResultItem[] = [];

  data: any = [
    {
      "title": "Dashboard",
      "description": "Go to the WordPress dashboard",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/",
      }
    },
    {
      "title": "Updates",
      "description": "Manage WordPress updates",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/update-core.php",
      }
    },
    {
      "title": "View All Posts",
      "description": "View all posts",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/edit.php",
      }
    },
    {
      "title": "Add New Post",
      "description": "Add a new post",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/post-new.php",
      }
    },
    {
      "title": "Manage Categories",
      "description": "",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/edit-tags.php?taxonomy=category",
      }
    },
    {
      "title": "Manage Tags",
      "description": "",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/edit-tags.php?taxonomy=post_tag",
      }
    },
    {
      "title": "Media Library",
      "description": "Open the media library",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/upload.php",
      }
    },
    {
      "title": "Upload Media",
      "description": "Upload a new media to the media library",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/media-new.php",
      }
    },
    {
      "title": "View All Page",
      "description": "View all pages",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/edit.php?post_type=page",
      }
    },
    {
      "title": "Add New Page",
      "description": "Add a new page",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/post-new.php?post_type=page",
      }
    },
    {
      "title": "Themes (Appearance)",
      "description": "",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/themes.php",
      }
    },
    {
      "title": "Customize (Appearance)",
      "description": "",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/customize.php?return=%2Fwp-admin%2F",
      }
    },
    {
      "title": "Widgets (Appearance)",
      "description": "",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/widgets.php",
      }
    },
    {
      "title": "Menus (Appearance)",
      "description": "",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/nav-menus.php",
      }
    },
    {
      "title": "Installed Plugins",
      "description": "",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/plugins.php",
      }
    },
    {
      "title": "Add New Plugin",
      "description": "",
      "action": {
        "type": "url",
        "target": "self",
        "url": "/wp-admin/plugin-install.php",
      }
    },
    {
      "title": "Add New Student",
      "description": "",
      "action": {
        "type": "input",
        "inputs": [
          {
            "type": "text",
            "title": "Please provide the student's name",
            "name": "name",
            "required": true,
          },
          {
            "type": "number",
            "title": "Please provide the student's age",
            "name": "age",
            "required": true,
          },
          {
            "type": "choice",
            "title": "What is the student's gender?",
            "name": "gender",
            "required": true,
            "choices": {
              "male": "Male",
              "female": "Female",
            }
          },
        ]
      }
    },
  ];

  actions: any = [];

  textInput!: HTMLInputElement;

  private requestAbortSignal: PromiseAbortSignal = new PromiseAbortSignal();

  /**
   * The api endpoint
   */
  @Prop() url: string;

  @Event() actionSelected: EventEmitter<any>;

  constructor() {
    this.reset();
  }

  componentWillLoad() {
    //this.openSpotlight();
  }

  componentDidLoad() {
    console.info(this.el);
  }

  reset() {
    this.dblCtrlKey = 0;
    this.tick = 0;
    this.currentActiveItemIndex = -1;
    this.isOpen = false;
    this.results = [];
    this.currentStepHelpText = this.defaultHelpText;
    this.helpText = this.defaultHelpText;
    this.actions = [];
  }

  loadData(inputText: string, abortSignal: PromiseAbortSignal) {
    return new Promise((resolve, reject) => {
      abortSignal.setup(reject);
      abortSignal.complete();
      const searchResults = search(this.data, ['title', 'description'], inputText, {withScore: true});

      const results = searchResults.sort((a: {score: number, element: any}, b: {score: number, element: any}) => {
        return b.score - a.score;
      }).filter((result: {score: number, element: any}) => result.score > 0)
        .map((result: {score: number, element: any}) => result.element );

      resolve(results);

      // setTimeout(() => {
      //   abortSignal.complete();
      //   return resolve([]);
      // }, 1000);
    })
  }

  getActiveItem() {
    if (this.currentActiveItemIndex !== -1 && this.results && this.results.length > this.currentActiveItemIndex) {
      return this.results[this.currentActiveItemIndex];
    }

    return null;
  }

  setActiveItem(index: number) {
    this.currentActiveItemIndex = index;

    if (this.typedText === '' && this.currentActiveItemIndex === -1) {
      this.helpText = this.currentStepHelpText;

    }

    if (this.results && this.results.length > index) {
      this.updateActiveItem();
    }
  }

  updateActiveItem() {
    this.results.forEach((result) => {
      result.isActive = false;
    });

    if (this.currentActiveItemIndex !== -1) {
      this.results[this.currentActiveItemIndex].isActive = true;
      this.setHelpText(this.results[this.currentActiveItemIndex].title);
    }
  }

  onKeyDown(event: KeyboardEvent) {
    const inputElement = (event.currentTarget as HTMLInputElement);
    this.typedText = inputElement.value;
    // this.helpText = '';

    if (event.key === 'Tab') {
      event.preventDefault();
      event.stopImmediatePropagation();
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const activeItem = this.getActiveItem();
      if (activeItem && activeItem.action) {

        if(activeItem.action.type === 'input') {
          console.log(activeItem.action);
          this.actions = [];
          this.actions.push(activeItem);

          inputElement.value = '';
          this.typedText = '';
          this.currentStepHelpText = activeItem.action.inputs[0].title;
          this.helpText = activeItem.action.inputs[0].title;
          this.results = [];
          inputElement.focus();

        } else if(activeItem.action.type === 'url') {
           window.location = activeItem.action.url;
        } else {
          this.actionSelected.emit(activeItem);
        }
      }

    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (this.currentActiveItemIndex > 0) {
        this.setActiveItem(this.currentActiveItemIndex - 1);
      }
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      event.stopPropagation()
      if (this.currentActiveItemIndex < (this.results.length - 1)) {
        this.setActiveItem(this.currentActiveItemIndex + 1);
      }
    }

  }

  onInputChange(event: InputEvent) {
    this.typedText = (event.currentTarget as HTMLInputElement).value;

    if(this.requestAbortSignal.isPending()) {
      this.requestAbortSignal.reject('Cancelled');
    }

    this.loadData(this.typedText, this.requestAbortSignal)
      .then((results: []) => {
        console.log('Promise completed: ', results.length);
        const searchResults: UnySpotLightSearchResultItem[] = results.map((result: any) => {
          return new UnySpotLightSearchResultItem(result.title, result.description, result.image, result.action);
        });

        this.results = searchResults;

        this.helpText = '';

        if(this.results.length) {
          this.setActiveItem(0);
        } else {
          this.setActiveItem(-1);
        }

      })
      .catch((reason) => {
        console.log('Promise failed: ', reason);
      });
  }

  onResultItemHover(_event: MouseEvent, index: number) {
    if(this.currentActiveItemIndex !== index) {
      this.setActiveItem(index);
    }
  }

  @Listen('keydown', {target: 'document'})
  handleKeypress(event: KeyboardEvent) {
    if (event.key === 'Control' && !this.isOpen) {
      if (this.dblCtrlKey > 0) {
        this.openSpotlight();
        this.dblCtrlKey = 0;
      } else {
        this.dblCtrlKey++
        setTimeout(() => {
          this.dblCtrlKey = 0
        }, 400);
      }
    } else {
      this.dblCtrlKey = 0
    }

    // hide spotlight on ESC
    if (event.key === 'Escape') {
      this.closeSpotlight();
    }
  }

  private openSpotlight() {
    this.reset();
    this.isOpen = true;
    setTimeout(() => {
      this.textInput && this.textInput.focus();
    }, 0)

  }

  private setHelpText(text: string) {
    if (!text.startsWith(this.typedText)) {
      this.helpText = ' - '.concat(text);
      return;
    }

    this.helpText = text.substring(this.typedText.length);
  }

  private helpTextClasses() {
    const classes = [];
    if (this.helpText.startsWith(' - ')) {
      classes.push('spotlight-search__input-decorator__help-text--small');
    }

    return classes;
  }

  private closeSpotlight() {
    this.isOpen = false;
  }

  render() {

    if (!this.isOpen) {
      return null;
    }

    let searchResultClasses = ['spotlight-search__results'];

    if (this.results.length) {
      searchResultClasses.push('spotlight-search__results--empty');
    }

    return [
      <div class="spotlight-search-backdrop"></div>,
      <div class="spotlight-search-debug"></div>,
      <nav class="spotlight-search">
        <div class="spotlight-search__search">
          <div class="spotlight-search__input-decorator">
            <span class="spotlight-search__input-decorator__typed-text">{this.typedText}</span>
            <span class={[...this.helpTextClasses(), 'spotlight-search__input-decorator__help-text'].join(' ')}>{this.helpText}</span>
          </div>
          <input
            class="spotlight-search__input"
            type="text"
            ref={(element) => {
              this.textInput = element as HTMLInputElement
            }}
            onInput={(event: InputEvent) => {
              this.onInputChange(event)
            }}
            onKeyDown={(event: KeyboardEvent) => {
              this.onKeyDown(event)
            }}
            autofocus/>
        </div>
        <div class={searchResultClasses.join(' ')}>
          <ul class="spotlight-search__list">
            {this.results.map((result, index) =>
              <li class={result.getCssClasses()} onMouseOver={(event) => this.onResultItemHover(event, index)}>
                <div class="spotlight-search__info">
                  <h3 class="spotlight-search__title">{result.title}</h3>
                  {(result.description &&
                  <p class="spotlight-search__subtitle">{result.description}</p>
                  )}
                </div>
              </li>
            )}
          </ul>
          <div class="spotlight-search__indicator">
            <div class="spotlight-search__thumb"></div>
          </div>
        </div>
      </nav>
    ];
  }
}
