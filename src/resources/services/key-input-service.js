import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class KeyInputService {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._keys = {
            'enter': 13,
            'space': 32,
            'escape': 27,
            'left': 37,
            'up': 38,
            'right': 39,
            'down': 40,
            'r': 82
        };
        document.addEventListener('keydown', event => this.handleKeyInput(event), true);
    }

    handleKeyInput(event) {
        let keycode = event.keyCode;
        switch (keycode) {
            case this._keys.left:
                this._eventAggregator.publish('keyPressed', 'left');
                break;
            case this._keys.up:
                this._eventAggregator.publish('keyPressed', 'up');
                break;
            case this._keys.right:
                this._eventAggregator.publish('keyPressed', 'right');
                break;
            case this._keys.down:
                this._eventAggregator.publish('keyPressed', 'down');
                break;
            case this._keys.enter:
                this._eventAggregator.publish('start');
                break;
            case this._keys.space:
                this._eventAggregator.publish('start');
                break;
            case this._keys.escape:
                this._eventAggregator.publish('giveUp');
                break;
            case this._keys.r:
                this._eventAggregator.publish('retry');
                break;
            default:
                this._eventAggregator.publish('keyPressed', 'somekey');
        }
        return true;
    }

}
