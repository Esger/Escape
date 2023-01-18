import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class KeyInputService {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        document.addEventListener('keydown', event => {
            this.handleKeyInput(event);
        });
    }

    handleKeyInput(event) {
        switch (event.code) {
            case 'ArrowLeft':
                this._eventAggregator.publish('moveKeyPressed', 'left');
                break;
            case 'ArrowUp':
                this._eventAggregator.publish('moveKeyPressed', 'up');
                break;
            case 'ArrowRight':
                this._eventAggregator.publish('moveKeyPressed', 'right');
                break;
            case 'ArrowDown':
                this._eventAggregator.publish('moveKeyPressed', 'down');
                break;
            case 'Enter':
                this._eventAggregator.publish('start');
                break;
            case 'Space':
                this._eventAggregator.publish('start');
                break;
            case 'Escape':
                this._eventAggregator.publish('giveUp');
                break;
            default:
                this._eventAggregator.publish('KeyPressed', 'somekey');
        }
        return true;
    }

}
