import {Listen, Component, Element, State, Prop, h} from '@stencil/core';

type UnySpotLightSearchResultItem = {
  image: string;
  title: string;
  description: string;
};

@Component({
  tag: 'uny-spotlight-search',
  styleUrl: 'uny-spotlight-search.css',
  shadow: true,
})
export class UnySpotlightSearch {

  @Element() private el: HTMLElement;

  @State() dblCtrlKey: number = 0;

  @State() isOpen: boolean = true;

  @State() currentPlaceholder: string = 'What are you looking for?';

  @State() results: UnySpotLightSearchResultItem[] = [
    {
      image: 'https://i.picsum.photos/id/609/16/16.jpg?hmac=W_DSzvH_u4Jj8F6xaeuuix7okHy6JnFfYWvz531pXFY',
      title: ' ~ First Result',
      description: 'Insert a new row'
    }];

  textInput!: HTMLInputElement;

  /**
   * The api endpoint
   */
  @Prop() url: string;

  componentDidLoad() {
    console.log(this.el); // outputs HTMLElement <my-component ...
  }

  onInputChange(event: InputEvent) {
    const value = (event.currentTarget as HTMLInputElement).value;
    this.results = [
      {
        image: 'https://i.picsum.photos/id/609/16/16.jpg?hmac=W_DSzvH_u4Jj8F6xaeuuix7okHy6JnFfYWvz531pXFY',
        title: value + ' ~ First Result',
        description: 'Insert a new row'
      }
    ];
    console.log(this.results);
  }

  @Listen('keydown', {target: 'document'})
  handleKeypress(event: KeyboardEvent) {
    console.log(event);

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

  private openSpotlight()
  {
    this.isOpen = true;
    setTimeout(() => {this.textInput && this.textInput.focus();}, 0)

  }
  private closeSpotlight()
  {
    this.isOpen = false;
  }

  // @Watch('isOpen')
  // onOpen(newValue: boolean, oldValue: boolean) {
  //   console.log(newValue, oldValue);
  //   if (newValue === true && oldValue === false && this.textInput) {
  //     this.textInput.focus();
  //   }
  // }

  render() {
    if (!this.isOpen) {
      return null;
    }

    return [
      <div class="spotlight-search-backdrop"></div>,
      <div class="spotlight-search-debug">
        <h2>Ctrl Key Count: {this.dblCtrlKey}</h2>
        <div>{this.dblCtrlKey === 0 && <h3>ZERO</h3>}</div>
      </div>,
      <nav class="spotlight-search">
        <div class="spotlight-search__search">
          <div class="spotlight-search__input-bg" data-autocomplete=""></div>
          <input
            class="spotlight-search__input"
            type="text"
            placeholder={this.currentPlaceholder}
            ref={(element) => {this.textInput = element as HTMLInputElement}}
            onInput={this.onInputChange}
            autofocus />
        </div>
        <div class="spotlight-search__results spotlight-search__results--empty">
          <ul class="spotlight-search__list">
            {this.results.map((result) =>
              <li class="spotlight__item" onMouseOver={(e) => {console.log(e)}}>
                <div class="spotlight__info">
                  <figure class="spotlight__figure">
                    <img src={result.image}  class="spotlight__image" />
                  </figure>
                  <h3 class="spotlight__title">{result.title}</h3>
                  <p class="spotlight__subtitle">{result.description}</p>
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
