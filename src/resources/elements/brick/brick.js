import { inject, bindable } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class BrickCustomElement {
    @bindable last;
    @bindable brickIndex;

    _squares = [[0, 0]];

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
    }

    attached() {
        this._positionSubscription = this._eventAggregator.subscribe('brickPosition', brick => {
            (brick.index == this.brickIndex) && this.setPosition(brick);
        });
        setTimeout(() => {
            if (this.last) {
                this._eventAggregator.publish('bricksReady');
            }
        });
    }

    detached() {
        this._positionSubscription.dispose();
    }

    setPosition(brick) {
        this.left = brick.position.left;
        this.top = brick.position.top;
    }

    valueChanged(newValue, oldValue) {
        //
    }

}
