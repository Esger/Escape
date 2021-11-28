import { inject, bindable } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class BrickCustomElement {
    @bindable last;
    @bindable brickIndex;
    @bindable left;
    @bindable top;
    @bindable direction;
    @bindable blockSize;

    blocks = [];

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this.blocSize
    }

    attached() {
        this._setBlocks();
    }

    _setBlocks() {
        this.blocks.push([0, 0]);
        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        this.blocks.push(directions[this.direction]);
    }

    detached() {
    }

    valueChanged(newValue, oldValue) {
        //
    }

}
