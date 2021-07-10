import {Listen, Component, Element, State, Prop, h, Event, Host, EventEmitter} from '@stencil/core';
import {HTMLStencilElement} from "@stencil/core/internal";
import {search} from "ss-search";
import {disableBodyScroll, enableBodyScroll} from 'body-scroll-lock';
import {UnySpotLightSearchResultItem} from "../../classes/UnySpotLightSearchResultItem";
import {PromiseAbortSignal} from "../../classes/PromiseAbortSignal";
import {PreviewPaneRenderer} from "../../classes/PreviewPaneRenderer";

@Component({
    tag: 'uny-spotlight-search',
    styleUrl: 'uny-spotlight-search.scss',
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

    private currentStepResults: [] = null;

    @State() helpText: string = '';

    @State() results: UnySpotLightSearchResultItem[] = [];

    @State() currentActiveItem: UnySpotLightSearchResultItem;

    data: any = null;

    actions: any = [];

    textInput!: HTMLInputElement;

    searchElement!: HTMLElement;

    private requestAbortSignal: PromiseAbortSignal = new PromiseAbortSignal();

    @Prop() url: string;

    @Event() actionSelected: EventEmitter<any>;

    private showPreview: boolean = true;

    constructor() {
        this.reset();
    }

    componentWillLoad() {
        //this.openSpotlight();
    }

    componentDidLoad() {
        this.fetchIndex();
    }

    connectedCallback() {

    }

    disconnectedCallback() {

    }

    handleClickOutside()
    {
        this.closeSpotlight();
    }

    registerClickOutsideHandler()
    {
        this.unregisterClickOutsideHandler();

        window.addEventListener('click', this.handleClickOutside.bind(this), false);
    }

    unregisterClickOutsideHandler()
    {
        window.removeEventListener('click', this.handleClickOutside.bind(this), false);
    }


    reset() {
        this.dblCtrlKey             = 0;
        this.tick                   = 0;
        this.currentActiveItemIndex = -1;
        this.currentActiveItem      = null;
        this.currentStepResults     = null;
        this.isOpen                 = false;
        this.results                = [];
        this.currentStepHelpText    = this.defaultHelpText;
        this.helpText               = this.defaultHelpText;
        this.actions                = [];
        this.typedText = '';

        if (this.textInput) {
            this.textInput.value = '';
        }
    }

    fetchIndex()
    {
        fetch(this.url)
            .then(response => response.json())
            .then(data => {
                this.data = data
            });
    }

    loadData(inputText: string, abortSignal: PromiseAbortSignal) {
        return new Promise((resolve, reject) => {
            abortSignal.setup(reject);
            abortSignal.complete();
            const searchResults = search(this.data, ['title', 'description'], inputText, {withScore: true});

            const results = searchResults.sort((a: { score: number, element: any }, b: { score: number, element: any }) => {
                return b.score - a.score;
            }).filter((result: { score: number, element: any }) => result.score > 0)
                                         .map((result: { score: number, element: any }) => result.element);

            resolve(results);
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
        this.currentActiveItem = null;
        this.results.forEach((result) => {
            result.isActive = false;
        });

        if (this.currentActiveItemIndex !== -1) {
            this.results[this.currentActiveItemIndex].isActive = true;
            this.currentActiveItem                             = this.results[this.currentActiveItemIndex];
            this.setHelpText(this.results[this.currentActiveItemIndex].title);
        }
    }

    onKeyDown(event: KeyboardEvent) {
        const inputElement = (event.currentTarget as HTMLInputElement);
        this.typedText     = inputElement.value;
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

                if (activeItem.action.type === 'input') {
                    console.log(activeItem.action);
                    this.actions = [];
                    this.actions.push(activeItem);

                    inputElement.value       = '';
                    this.typedText           = '';
                    this.currentStepHelpText = activeItem.action.inputs[0].title;
                    this.helpText            = activeItem.action.inputs[0].title;
                    this.results             = [];
                    this.currentStepResults  = [];
                    inputElement.focus();

                } else if (activeItem.action.type === 'url') {
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

        if (this.requestAbortSignal.isPending()) {
            this.requestAbortSignal.reject('Cancelled');
        }

        if (this.currentStepResults !== null) {
            this.results = this.currentStepResults.map((result: any) => {
                return new UnySpotLightSearchResultItem(result.title, result.description, result.image, result.action);
            });

            this.helpText = '';

            if (this.results.length) {
                this.setActiveItem(0);
            } else {
                this.setActiveItem(-1);
            }

        } else {
            this.loadData(this.typedText, this.requestAbortSignal)
                .then((results: []) => {
                    console.log('Promise completed: ', results.length);
                    this.results = results.map((result: any) => {
                        return new UnySpotLightSearchResultItem(result.title, result.description, result.image, result.action);
                    });

                    this.helpText = '';

                    if (this.results.length) {
                        this.setActiveItem(0);
                    } else {
                        this.setActiveItem(-1);
                    }

                })
                .catch((reason) => {
                    console.log('Promise failed: ', reason);
                });
        }
    }

    onResultItemClick(_event: MouseEvent, index: number) {
        console.log(_event);
        console.log(index);
    }

    onResultItemHover(_event: MouseEvent, index: number) {
        if (this.currentActiveItemIndex !== index) {
            this.setActiveItem(index);
        }
    }

    /**
     * Naming convention: @see https://gomakethings.com/custom-event-naming-conventions-in-vanilla-js/
     *
     * @param event
     */
    @Listen('uny:spotlight-search', {target: 'window'})
    handleGlobalSpotlightSearchEvent(event: Event) {
        console.log(event);
        this.openSpotlight();
    }

    /**
     *
     * @param event
     */
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


    private setHelpText(text: string) {
        if (!text.startsWith(this.typedText)) {
            this.helpText = ' - '.concat(text);
            return;
        }

        this.helpText = text.substring(this.typedText.length);
    }

    private helpTextClasses() {
        const classes = ['spotlight-search__input-decorator__help-text'];
        if (this.helpText.startsWith(' - ')) {
            classes.push('spotlight-search__input-decorator__help-text--small');
        }

        return classes;
    }

    private openSpotlight() {
        if (!this.data) {
            return;
        }

        this.registerClickOutsideHandler();
        disableBodyScroll(this.el)
        this.reset();
        this.isOpen = true;
        setTimeout(() => {
            this.textInput && this.textInput.focus();
        }, 0)
    }

    private closeSpotlight() {
        this.isOpen = false;
        this.unregisterClickOutsideHandler();
        enableBodyScroll(this.el);
    }

    render() {
        let searchResultClasses = ['spotlight-search__results'];

        if (this.showPreview) {
            searchResultClasses.push('spotlight-search__results--with-preview');
        }

        if (this.results.length) {
            searchResultClasses.push('spotlight-search__results--empty');
        }

        return (
            <Host aria-hidden={this.isOpen ? 'false' : 'true'} class={{'is-open': this.isOpen}}>
                <div class="spotlight-search-backdrop" />
                <div class="spotlight-search-debug" />
                <nav class="spotlight-search"
                     onClick={(event: MouseEvent) => {
                        event.stopPropagation();
                    }} ref={(element) => {
                        this.searchElement = element as HTMLElement;
                    }}>
                    <div class="spotlight-search__search">
                        <div class="spotlight-search__input-decorator">
                            <span class="spotlight-search__input-decorator__typed-text">{this.typedText}</span>
                            <span
                                class={this.helpTextClasses().join(' ')}>{this.helpText}</span>
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
                        <div class="spotlight-search__list-wrapper">
                            <ul class="spotlight-search__list">
                                {this.results.map((result, index) =>
                                    <li class={result.getCssClasses()}
                                        onClick={(event) => this.onResultItemClick(event, index)}
                                        onMouseOver={(event) => this.onResultItemHover(event, index)}>
                                        <div class="spotlight-search__info">
                                            <h3 class="spotlight-search__title">{result.title}</h3>
                                        </div>
                                    </li>
                                )}
                            </ul>
                        </div>
                        {(this.showPreview && this.currentActiveItem && PreviewPaneRenderer.render(this.currentActiveItem))}
                    </div>
                </nav>
            </Host>
        );
    }
}
