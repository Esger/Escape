import { inject, bindable } from "aurelia-framework";
import { EventAggregator } from 'aurelia-event-aggregator';
import { DirectionToVectorValueConverter } from "resources/value-converters/direction-to-vector-value-converter";

@inject(EventAggregator, DirectionToVectorValueConverter)
export class BrickCustomElement {
    @bindable brick;
    @bindable blockSize;

    constructor(eventAggregator, directionToVectorValueConverter) {
        this._eventAggregator = eventAggregator;
        this._directionToVector = directionToVectorValueConverter;
    }

    attached() {
        this._setBlocks();
        this.directionClass = ['toRight', 'toBottom', 'toLeft', 'toTop'][this.brick.direction];
    }

    isOdd = (num) => { return num % 2 }

    _setBlocks() {
        this.brick.blocks = [];
        this.brick.blocks.push([0, 0]);
        this.brick.blocks.push(this._directionToVector.toView(this.brick.direction));
    }

}
