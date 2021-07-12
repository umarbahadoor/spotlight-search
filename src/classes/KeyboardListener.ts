/**
 * A simplified object containing only the most important properties of the KeyboardEvent
 */
interface KeyBindingInterface {
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    key: string
}

/**
 * A dedicated class to handle keyboard events and check if it matches a set of defined sequences.
 */
export class KeyboardListener {
    // noinspection NonAsciiCharacters
    static readonly modifiers = {
        '⇧': 'shift',
        'shift': 'shift',
        '⌥': 'alt',
        'alt': 'alt',
        'option': 'alt',
        '⌃': 'ctrl',
        'ctrl': 'ctrl',
        'control': 'ctrl',
        '⌘': 'cmd',
        'cmd': 'cmd',
        'command': 'cmd',
    };

    static readonly abbreviationMap = {
        'cmd': 'meta',
        'ctrl': 'control',
        'alt': 'alt',
        'shift': 'shift',
    };

    keyboardSequences: KeyBindingInterface[][];

    pressedKeyboardSequences: KeyBindingInterface[];

    maxSequenceLength: number = 1;

    timerDuration: number = 500;

    timeoutID: any;

    callback: () => void;

    constructor(shortcuts, callback: () => void, addDocumentEventListener: boolean = true) {
        this.callback = callback;

        this.pressedKeyboardSequences = [];

        this.keyboardSequences = this.normalizeKeyboardSequences(shortcuts);

        const lengths = this.keyboardSequences.map((sequence) => sequence.length);

        this.maxSequenceLength = Math.max(... lengths);

        if (addDocumentEventListener) {
            document.addEventListener('keydown', this.handleKeyboardEvent.bind(this));
        }
    }

    public handleKeyboardEvent(event: KeyboardEvent): void {
        const keyBinding = KeyboardListener.convertKeyboardEvent(event);
        if (this.pressedKeyboardSequences.length === this.maxSequenceLength) {
            this.pressedKeyboardSequences.shift();
        }

        this.pressedKeyboardSequences.push(keyBinding);

        if (this.timeoutID) {
            clearTimeout(this.timeoutID);
        }

        this.timeoutID = setTimeout(() => {
            this.pressedKeyboardSequences = [];
        }, this.timerDuration)

        if (this.checkPressedKeyboardSequences()) {
            this.callback.call(null);
        }
    }

    private sequenceEquals(a, b) {
        return Array.isArray(a) &&
            Array.isArray(b) &&
            a.length === b.length &&
            a.every((_val, index) => KeyboardListener.keybindingEquals(a[index], b[index]));
    }

    private static keybindingEquals(a: KeyBindingInterface, b: KeyBindingInterface) {
        return a.key === b.key
            && a.metaKey === b.metaKey
            && a.ctrlKey === b.ctrlKey
            && a.shiftKey === b.shiftKey
            && a.altKey === b.altKey;
    }

    private checkPressedKeyboardSequences(): boolean {
        let isValid: boolean = false;

        this.keyboardSequences.forEach((sequence) => {
            if (this.pressedKeyboardSequences.length >= sequence.length) {
                isValid = isValid || this.sequenceEquals(
                    sequence.slice().reverse(),
                    this.pressedKeyboardSequences.slice(0, sequence.length).reverse()
                );
            }
        });

        return isValid;
    }

    private static convertKeyboardEvent(event: KeyboardEvent): KeyBindingInterface {
        return {
            key: event.key.toLowerCase(),
            altKey: event.altKey,
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            shiftKey: event.shiftKey
        };
    }

    private static trim(str: string) {
        return str.trim()
    }

    private static getKeybinding(key: string, modifier: string): KeyBindingInterface {
        return {
            key: key,
            shiftKey: modifier === 'shift',
            altKey: modifier === 'alt',
            ctrlKey: modifier === 'ctrl',
            metaKey: modifier === 'cmd',
        }
    }

    private static normalizeSingleKeybinding(keybinding) {
        if (keybinding.includes('+')) {
            const shortcutTokens = keybinding.split('+');

            if (shortcutTokens.length !== 2) {
                throw new Error('Invalid keybinding provided - wrong format');
            }

            if (!KeyboardListener.modifiers.hasOwnProperty(shortcutTokens[0])) {
                throw new Error('Invalid keybinding provided - modifier not allowed');
            }

            const modifier = KeyboardListener.modifiers[shortcutTokens[0]];

            return KeyboardListener.getKeybinding(shortcutTokens[1], modifier);
        } else {
            const key = KeyboardListener.abbreviationMap.hasOwnProperty(keybinding)
                ? KeyboardListener.abbreviationMap[keybinding]
                : keybinding;

            return KeyboardListener.getKeybinding(key, keybinding);
        }
    }

    private normalizeKeyboardSequences(shortcuts): KeyBindingInterface[][] {
        return shortcuts
               .toLowerCase()
               .split(',').map(KeyboardListener.trim.bind(this))
               .map(shortcut => shortcut.split('>').map(KeyboardListener.trim.bind(this)))
               .map(shortcuts => shortcuts.map(KeyboardListener.normalizeSingleKeybinding.bind(this)));
    }
}
