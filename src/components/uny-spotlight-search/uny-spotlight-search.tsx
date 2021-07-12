import {Listen, Component, Element, State, Prop, h, Event, Host, EventEmitter} from '@stencil/core';
import {HTMLStencilElement} from "@stencil/core/internal";
import {search} from "ss-search";
import {disableBodyScroll, enableBodyScroll} from 'body-scroll-lock';
import {SpotLightSearchResultItem} from "../../classes/SpotLightSearchResultItem";
import {PreviewPaneRenderer} from "../../classes/PreviewPaneRenderer";
import {KeyboardListener} from "../../classes/KeyboardListener";

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

    @Prop() url: string;

    @Prop() closeOnEscape: boolean = true;

    @Prop() keyboardShortcuts: string = 'Ctrl > Ctrl, Shift > Shift, Cmd+S, A > B > C';

    @Event() actionSelected: EventEmitter;

    @Element() private el: HTMLStencilElement;

    @State() currentActiveItemIndex: number = -1;

    @State() isOpen: boolean = false;

    @State() typedText: string = '';

    @State() helpText: string = '';

    @State() results: SpotLightSearchResultItem[] = [];

    @State() currentActiveItem: SpotLightSearchResultItem;

    private currentSelectedItem: SpotLightSearchResultItem;

    private currentInputFormData: any = {};

    private currentInputIndex: number;

    private defaultHelpText: string = 'What are you looking for?';

    private currentStepHelpText: string = '';

    private currentStepResults: [] = null;

    private data: any = null;

    private textInput!: HTMLInputElement;

    private searchElement!: HTMLElement;

    private keyboardListener: KeyboardListener;

    private showPreview: boolean = true;

    /**
     *
     */
    constructor() {
        this.reset();

        this.keyboardListener = new KeyboardListener(this.keyboardShortcuts, () => {
            this.openSpotlight();
        }, false);

        console.log(this.searchElement);
    }

    /**
     * We load the index asynchronously as soon as the component has been loaded.
     */
    componentDidLoad() {
        this.fetchIndex();
    }

    /**
     * Handles clicks outside of the component
     */
    handleClickOutside() {
        this.closeSpotlight();
    }

    /**
     * Registers the event listeners for click-outside
     */
    registerClickOutsideHandler() {
        this.unregisterClickOutsideHandler();

        window.addEventListener('click', this.handleClickOutside.bind(this), false);
    }

    /**
     * Removes the event listeners for click-outside
     */
    unregisterClickOutsideHandler() {
        window.removeEventListener('click', this.handleClickOutside.bind(this), false);
    }

    /**
     * Resets the state to all the defaults.
     *
     */
    reset() {
        this.isOpen                 = false;
        this.currentActiveItemIndex = -1;
        this.currentActiveItem      = null;
        this.currentSelectedItem    = null;
        this.currentStepResults     = null;
        this.currentInputIndex      = -1;
        this.results                = [];
        this.currentStepHelpText    = this.defaultHelpText;
        this.helpText               = this.defaultHelpText;

        this.typedText              = '';

        if (this.textInput) {
            this.textInput.value = '';
        }
    }

    /**
     * Retrieved the indexed data from the provided URL.
     */
    fetchIndex() {
        fetch(this.url)
            .then(response => response.json())
            .then(data => {
                this.data = data
            });
    }

    /**
     * Used to compare search results based on the score
     *
     * @param a
     * @param b
     */
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
        if (this.currentStepResults !== null) {
            return new Promise((resolve) => {
               resolve(this.currentStepResults);
            });
        }

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
     * @return SpotLightSearchResultItem | null
     */
    getActiveItem(): SpotLightSearchResultItem | null {
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
     * Converts a search result to the appropriate model.
     *
     * @param result
     */
    mapSpotLightSearchResults(result: any): SpotLightSearchResultItem {
        return new SpotLightSearchResultItem(
            result.title,
            result.description,
            result.image,
            result.action
        );
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
            inputElement.value = this.getActiveItem().title;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.handleActionSelected(this.getActiveItem());
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
            event.stopImmediatePropagation()
            if (this.currentActiveItemIndex < (this.results.length - 1)) {
                this.setActiveItemByIndex(this.currentActiveItemIndex + 1);
            }
        }

    }

    /**
     * The text in the search input has changed, so we update the typed text and we perform another search.
     *
     * @param event
     */
    onInputChange(event: InputEvent) {
        this.typedText = (event.currentTarget as HTMLInputElement).value;

        this.search(this.typedText)
            .then((results: []) => {
                this.helpText = '';
                this.results = results.map(this.mapSpotLightSearchResults.bind(this));

                this.setActiveItemByIndex(this.results.length ? 0 : -1);
            });
    }

    /**
     * Handles an action selected.
     *
     * @param item
     */
    handleActionSelected(item: any) {
        const inputElement = this.textInput as HTMLInputElement;

        if (!item && this.currentSelectedItem) {
            item = this.currentSelectedItem;
        }

        if (item && item.action) {
            if (!this.currentSelectedItem) {
                this.currentSelectedItem = item;
            }

            if (item.action.type === 'input') {
                this.setActiveItemByIndex(-1);

                this.currentInputIndex++;

                if (this.currentInputIndex === 0) {
                    this.currentInputFormData = {};
                }

                if (this.currentInputIndex > 0 && this.currentInputIndex <= item.action.inputs.length) {
                    const fieldName = item.action.inputs[this.currentInputIndex - 1].name;
                    this.currentInputFormData[fieldName] = inputElement.value;
                }

                inputElement.value       = '';
                this.typedText           = '';
                this.results             = [];

                if (this.currentInputIndex >= 0 && this.currentInputIndex < item.action.inputs.length) {
                    this.currentStepHelpText = item.action.inputs[this.currentInputIndex].title;
                    this.helpText            = item.action.inputs[this.currentInputIndex].title;
                    this.currentStepResults  = [];

                    inputElement.focus();
                } else {
                    console.log(this.currentInputFormData);
                    console.log('COMPLETED?');
                }

            } else if (item.action.type === 'url') {
                window.location = item.action.url;
            } else {
                this.actionSelected.emit(this.currentSelectedItem);
            }
        }
    }

    /**
     * Handles the case where a result item is clicked on. We handle it the same way
     * as when the keyboard was used.
     *
     * @param _event
     * @param index
     */
    onResultItemClick(_event: MouseEvent, index: number) {
        this.setActiveItemByIndex(index);

        this.handleActionSelected(this.getActiveItem());
    }

    /**
     * When a result item is being hovered on, we set it as the active item
     *
     * @param _event
     * @param index
     */
    onResultItemHover(_event: MouseEvent, index: number) {
        if (this.currentActiveItemIndex !== index) {
            this.setActiveItemByIndex(index);
        }
    }

    /**
     * Listen to a global event to open the spotlight-search
     *
     * Naming convention: @see https://gomakethings.com/custom-event-naming-conventions-in-vanilla-js/
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
        if (!this.isOpen) {
            this.keyboardListener.handleKeyboardEvent(event)
        }

        /**
         * Hide spotlight on ESC
         */
        if (this.isOpen && this.closeOnEscape && event.key === 'Escape') {
            this.closeSpotlight();
        }
    }

    /**
     * Sets the help text based on currently typed text.
     *
     * @param text
     * @private
     */
    private setHelpText(text: string) {
        if (!text.startsWith(this.typedText)) {
            this.helpText = ' - '.concat(text);
            return;
        }

        this.helpText = text.substring(this.typedText.length);
    }

    /**
     * Returns an array of classes that will be applied on the help text element.
     *
     * @private
     */
    private helpTextClasses() {
        const classes = ['spotlight-search__input-decorator__help-text'];
        if (this.helpText.startsWith(' - ')) {
            classes.push('spotlight-search__input-decorator__help-text--small');
        }

        return classes;
    }

    /**
     * Opens the spotlight search by setting the state `isOpen` to true.
     *
     * But also does other things:
     * 1. Registers a click outside handler on the window element
     * 2. Disables scrolling the body
     * 3. Resets the state of the component
     * 4. Sets the focus on the search input element
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
     *
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
                            <span class={this.helpTextClasses().join(' ')}>{this.helpText}</span>
                        </div>
                        <input
                            autofocus
                            type="text"
                            class="spotlight-search__input"
                            onKeyDown={this.onKeyDown.bind(this)}
                            onInput={this.onInputChange.bind(this)}
                            ref={(element) => this.textInput = element as HTMLInputElement}
                            />
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
