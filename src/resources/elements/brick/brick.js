import { inject, bindable } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class BrickCustomElement {
    @bindable brick;
    @bindable blockSize;


    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
    }

    attached() {
        this._setBlocks();
        this.directionClass = ['toRight', 'toBottom', 'toLeft', 'toTop'][this.brick.direction];
    }

    isOdd = (num) => { return num % 2 }

    _setBlocks() {
        this.brick.blocks = [];
        this.brick.blocks.push([0, 0]);
        const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        this.brick.blocks.push(directions[this.brick.direction]);
    }

    valueChanged(newValue, oldValue) {
        //
    }

}
