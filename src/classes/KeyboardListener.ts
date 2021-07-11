
interface KeyBinding {
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    key: string
}

class KeyboardListener {

    shortcuts: string = '';

    keyboardSequences: KeyBinding[][] = [];

    pressedKeyboardSequences: KeyBinding[] = [];

    constructor(shortcuts) {
        this.shortcuts = shortcuts;
        this.keyboardSequences = this.normalizeKeyboardSequences(shortcuts);
    }

    public isValidShortcode(event: KeyboardEvent): boolean {
        return false;
    }


    private normalizeKeyboardSequences(shortcuts): KeyBinding[][] {
        const modifiers = {
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

        const map = {
            'cmd': 'meta',
            'ctrl': 'control',
            'alt': 'alt',
            'shift': 'shift',
        };

        return shortcuts
               .toLowerCase()
               .split(',').map((shortcut) => shortcut.trim())
               .map(shortcut => shortcut.split('>').map((shortcut) => shortcut.trim()))
               .map(shortcuts =>
                   shortcuts.map((shortcut) => {
                       if (shortcut.includes('+')) {
                           const keyparts = shortcut.split('+');

                           if (keyparts.length !== 2) {
                               throw new Error('Invalid keybinding provided - wrong format');
                           }

                           if (!modifiers.hasOwnProperty(keyparts[0])) {
                               throw new Error('Invalid keybinding provided - modifier not allowed');
                           }

                           const modifier = modifiers[keyparts[0]];

                           return {
                               key: keyparts[1],
                               shiftKey: modifier === 'shift',
                               altKey: modifier === 'alt',
                               ctrlKey: modifier === 'ctrl',
                               metaKey: modifier === 'cmd',
                           }
                       } else {

                           return {
                               key: map.hasOwnProperty(shortcut) ? map[shortcut] : shortcut,
                               shiftKey: shortcut === 'shift',
                               altKey: shortcut === 'alt',
                               ctrlKey: shortcut === 'ctrl',
                               metaKey: shortcut === 'cmd',
                           };
                       }
                   })
               );
    }

}