import {Listen, Component, Element, State, Prop, h, Event, Host, EventEmitter} from '@stencil/core';
import {HTMLStencilElement} from "@stencil/core/internal";
import {search} from "ss-search";
import {disableBodyScroll, enableBodyScroll} from 'body-scroll-lock';
import {UnySpotLightSearchResultItem} from "../../classes/UnySpotLightSearchResultItem";
import {PreviewPaneRenderer} from "../../classes/PreviewPaneRenderer";

interface SearchResultWithScore {
    score: number;
    element: any;
}

/**
 *
 * @example
 * ```
 <uny-spotlight-search url="https://run.mocky.io/v3/9982f483-94f4-4224-abe9-4870857e7327"></uny-spotlight-search>
 <script>
    const elem = document.querySelector('uny-spotlight-search');
    elem.addEventListener('actionSelected', event => {
        console.log('actionSelected');
        console.log(event);
    });

    window.addEventListener('DOMContentLoaded', (event) => {
        const trigger = document.querySelector('.js-spotlight-search-trigger');
        trigger.addEventListener('click', function (e) {
            e.preventDefault()
            e.stopPropagation();
            window.dispatchEvent(new Event('uny:spotlight-search'));
        });
    });
 </script>
 * ```
 */
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

    actionCollection: [] = [];

    @Prop() url: string;

    @Prop() closeOnEscape: boolean = true;

    @Prop() keyboardShortcuts: string = 'Ctrl > Ctrl, Shift > Shift, Cmd+S';

    @Event() actionSelected: EventEmitter<any>;

    keyboardListener: KeyboardListener;

    private showPreview: boolean = true;

    constructor() {
        this.reset();
        this.keyboardListener = new KeyboardListener(this.keyboardShortcuts);
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

    handleClickOutside() {
        this.closeSpotlight();
    }

    registerClickOutsideHandler() {
        this.unregisterClickOutsideHandler();

        window.addEventListener('click', this.handleClickOutside.bind(this), false);
    }

    unregisterClickOutsideHandler() {
        window.removeEventListener('click', this.handleClickOutside.bind(this), false);
    }

    /**
     * Resets the state to all the defaults.
     *
     */
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
        this.typedText              = '';

        if (this.textInput) {
            this.textInput.value = '';
        }
    }

    fetchIndex() {
        fetch(this.url)
            .then(response => response.json())
            .then(data => {
                this.data = data
            });
    }

    searchResultsScoreCompareFunction(a: SearchResultWithScore, b: SearchResultWithScore)
    {
        return b.score - a.score;
    }

    /**
     * Performs a search within the index and returns a promise with the matched items.
     *
     * @param inputText
     */
    search(inputText: string): Promise<any[]>
    {
        return new Promise((resolve) => {
            const searchableKeys = ['title', 'description'];
            const options = {withScore: true};

            const searchResults = search(
                this.data,
                searchableKeys,
                inputText,
                options
            );

            const results = searchResults
                .sort(this.searchResultsScoreCompareFunction)
                .filter((result: SearchResultWithScore) => result.score > 0)
                .map((result: SearchResultWithScore) => result.element);

            resolve(results);
        })
    }

    /**
     * @return UnySpotLightSearchResultItem | null
     */
    getActiveItem(): UnySpotLightSearchResultItem | null {
        if (this.currentActiveItemIndex !== -1
            && this.results
            && this.results.length > this.currentActiveItemIndex
        ) {
            return this.results[this.currentActiveItemIndex];
        }

        return null;
    }

    /**
     *
     * @param index
     */
    setActiveItemByIndex(index: number) {
        /**
         * Perform some basic validation, to ensure integrity.
         */
        if (index < -1) {
            throw new Error('The index provided cannot be less than -1');
        }

        if (index > -1 && index >= this.results.length) {
            throw new Error('The index provided cannot be greater that the size of the results.');
        }

        /**
         * The most important task of this method. Actually set the currentActiveItemIndex.
         */
        this.currentActiveItemIndex = index;

        /**
         * If there is no typed text and the index is -1, we reset the help text.
         */
        if (this.typedText === '' && this.currentActiveItemIndex === -1) {
            this.helpText = this.currentStepHelpText;
        }

        /**
         * Check if the index exists in the results.
         * i.e. The result length is greater than the index.
         * e.g. If we have 5 items in our results, the index cannot exceed 4.
         */
        if (this.results && this.results.length > index) {
            /**
             * Reset the current active item, this will disable the current preview
             */
            this.currentActiveItem = null;

            /**
             * Remove the `isActive` property from all the current results
             */
            this.results.forEach((result) => {
                result.isActive = false;
            });

            /**
             * If the currentActiveItemIndex is -1, that means that we only removing
             * the active item. But any other value > 0, should update that specific
             * item in the results list. And also update the preview if any. Finally,
             * the help text should be updated to match the current active item.
             */
            if (this.currentActiveItemIndex !== -1) {
                this.results[this.currentActiveItemIndex].isActive = true;
                this.currentActiveItem = this.results[this.currentActiveItemIndex];
                this.setHelpText(this.results[this.currentActiveItemIndex].title);
            }
        }
    }

    /**
     * Handler for the `keydown` event of the main search input element.
     *
     * @param event
     */
    onKeyDown(event: KeyboardEvent) {
        const inputElement = (event.currentTarget as HTMLInputElement);
        this.typedText     = inputElement.value;

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
                this.setActiveItemByIndex(this.currentActiveItemIndex - 1);
            }
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            event.stopPropagation()
            if (this.currentActiveItemIndex < (this.results.length - 1)) {
                this.setActiveItemByIndex(this.currentActiveItemIndex + 1);
            }
        }

    }

    onInputChange(event: InputEvent) {
        this.typedText = (event.currentTarget as HTMLInputElement).value;

        if (this.currentStepResults !== null) {
            this.results = this.currentStepResults.map((result: any) => {
                return new UnySpotLightSearchResultItem(result.title, result.description, result.image, result.action);
            });

            this.helpText = '';

            if (this.results.length) {
                this.setActiveItemByIndex(0);
            } else {
                this.setActiveItemByIndex(-1);
            }

        } else {
            this.search(this.typedText)
                .then((results: []) => {
                    this.results = results.map((result: any) => {
                        return new UnySpotLightSearchResultItem(result.title, result.description, result.image, result.action);
                    });

                    this.helpText = '';

                    if (this.results.length) {
                        this.setActiveItemByIndex(0);
                    } else {
                        this.setActiveItemByIndex(-1);
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
            this.setActiveItemByIndex(index);
        }
    }

    /**
     * Listen to a global event to open the spotlight-search
     *
     * Naming convention: @see https://gomakethings.com/custom-event-naming-conventions-in-vanilla-js/
     *
     * @param event
     */
    @Listen('uny:spotlight-search', {target: 'window'})
    handleGlobalSpotlightSearchEvent() {
        this.openSpotlight();
    }

    /**
     * Listen to the document event of keydown to be able to use a keyboard shortcut
     * to open the spotlight.
     *
     * @param event
     */
    @Listen('keydown', {target: 'document'})
    handleKeypress(event: KeyboardEvent) {
        console.log(event);
        if (!this.isOpen && this.keyboardListener.isValidShortcode(event)) {
            this.openSpotlight();
            //if (event.key === 'Control' && !this.isOpen) {
            //    if (this.dblCtrlKey > 0) {
            //        this.openSpotlight();
            //        this.dblCtrlKey = 0;
            //    } else {
            //        this.dblCtrlKey++
            //        setTimeout(() => {
            //            this.dblCtrlKey = 0
            //        }, 400);
            //    }
            //} else {
            //    this.dblCtrlKey = 0
            //}
        }

        /**
         * Hide spotlight on ESC
         */
        if (this.isOpen && this.closeOnEscape && event.key === 'Escape') {
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

    /**
     * Opens the spotlight search by setting the state `isOpen` to true.
     * But also does other things:
     * 1. Registers a click outside handler on the window element
     * 2. Disables scrolling the body
     * 3. Resets the state of the component
     * 3. Sets the focus on the search input element
     *
     * @private
     */
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

    /**
     * Closes the spotlight search by setting the state `isOpen` to false.
     * But also does other things:
     * 1. Unregisters a click outside handler on the window element
     * 2. Enables scrolling the body
     *
     * @private
     */
    private closeSpotlight() {
        this.isOpen = false;
        this.unregisterClickOutsideHandler();
        enableBodyScroll(this.el);
    }

    /**
     * The main rendering method for the component.
     */
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
